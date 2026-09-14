import { NextResponse } from "next/server";
import {
  attachRazorpayOrder,
  cancelCustomerOrder,
  checkoutCreate,
} from "@/lib/shop/orders";
import { priceCart, validateCustomer } from "@/lib/shop/pricing";
import {
  razorpayConfigured,
  simulatedPaymentsAllowed,
  siteUrl,
  stockHoldMinutes,
} from "@/lib/shop/config";
import { createRazorpayOrder, RazorpayRequestError } from "@/lib/payments/razorpay";
import { isConfirmedOrder, toPublicOrder } from "@/lib/shop/serialize";
import type { CartLine, OrderPayload } from "@/lib/shop/types";
import { errMessage, log } from "@/lib/log";
import { assertCheckoutVerified } from "@/lib/shop/otp";
import { getProduct } from "@/data/products";

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = (await request.json()) as {
      idempotencyKey?: string;
      items?: CartLine[];
      customer?: Parameters<typeof validateCustomer>[0];
      verifyToken?: string;
    };

    const idempotencyKey = body.idempotencyKey?.trim() ?? "";
    if (idempotencyKey.length < 8) {
      log.info("checkout", "rejected missing idempotency key");
      return NextResponse.json({ error: "Missing checkout key" }, { status: 400 });
    }

    const customer = validateCustomer(body.customer ?? {});
    await assertCheckoutVerified({
      token: body.verifyToken,
      email: customer.email,
      phone: customer.phone,
    });
    const priced = priceCart(body.items ?? [], { destinationState: customer.state });
    log.debug("checkout", "priced cart", {
      lines: priced.items.length,
      totalPaise: priced.totalPaise,
      taxKind: priced.tax.taxKind,
      idempotencyKeyPrefix: idempotencyKey.slice(0, 8),
    });

    const payload = await checkoutCreate({
      idempotencyKey,
      customer,
      items: priced.items,
      subtotalPaise: priced.subtotalPaise,
      taxPaise: priced.tax.taxPaise,
      shippingPaise: priced.shippingPaise,
      totalPaise: priced.totalPaise,
      holdMinutes: stockHoldMinutes(),
      taxRateBps: priced.tax.taxRateBps,
      taxKind: priced.tax.taxKind,
      cgstPaise: priced.tax.cgstPaise,
      sgstPaise: priced.tax.sgstPaise,
      igstPaise: priced.tax.igstPaise,
    });

    log.info("checkout", "order ready", {
      publicId: payload.order.public_id,
      status: payload.order.status,
      totalPaise: payload.order.total_paise,
      ms: Date.now() - started,
    });

    if (isConfirmedOrder(payload.order)) {
      return NextResponse.json({
        alreadyPaid: payload.order.payment_status === "paid" || payload.order.payment_method === "cod",
        order: toPublicOrder(payload),
        accessToken: payload.order.access_token,
      });
    }

    if (!razorpayConfigured()) {
      if (!simulatedPaymentsAllowed()) {
        log.error("checkout", "payments not configured; restocking");
        await cancelCustomerOrder(payload.order.id, "payments_not_configured");
        return NextResponse.json(
          { error: "Payments are not configured yet. Add Razorpay keys to go live." },
          { status: 503 },
        );
      }

      log.info("checkout", "simulate provider", { publicId: payload.order.public_id });
      return NextResponse.json({
        provider: "simulate",
        order: toPublicOrder(payload),
        accessToken: payload.order.access_token,
        keyId: null,
        razorpayOrderId: null,
        amountPaise: payload.order.total_paise,
      });
    }

    let razorpayOrderId = payload.order.razorpay_order_id;
    if (!razorpayOrderId) {
      try {
        const razorpayOrder = await createRazorpayOrder({
          amountPaise: payload.order.total_paise,
          receipt: payload.order.public_id,
          notes: {
            public_id: payload.order.public_id,
            email: payload.order.email,
          },
          lineItems: magicLineItems(payload),
        });
        razorpayOrderId = razorpayOrder.order_id;
        await attachRazorpayOrder(payload.order.id, razorpayOrderId);
        log.info("checkout", "razorpay order attached", {
          publicId: payload.order.public_id,
          razorpayOrderId,
        });
      } catch (error) {
        log.error("checkout", "razorpay create failed; restocking", {
          publicId: payload.order.public_id,
          error: errMessage(error),
        });
        await cancelCustomerOrder(payload.order.id, "razorpay_create_failed");
        throw error;
      }
    } else {
      log.debug("checkout", "reusing razorpay order", {
        publicId: payload.order.public_id,
        razorpayOrderId,
      });
    }

    return NextResponse.json({
      provider: "razorpay",
      order: toPublicOrder(payload),
      accessToken: payload.order.access_token,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      razorpayOrderId,
      order_id: razorpayOrderId,
      amount: payload.order.total_paise,
      amountPaise: payload.order.total_paise,
      currency: "INR",
    });
  } catch (error) {
    if (error instanceof RazorpayRequestError) {
      log.error("checkout", "razorpay error", { error: error.message, status: error.status });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Checkout failed";
    const status = message.includes("sold out") ? 409 : 400;
    log.error("checkout", "failed", { error: message, status, ms: Date.now() - started });
    return NextResponse.json({ error: message }, { status });
  }
}

function magicLineItems(payload: OrderPayload) {
  const origin = siteUrl();
  const lines = payload.items.map((item) => {
    const product = getProduct(item.product_slug);
    const image = product?.images[0]?.src;
    return {
      sku: item.sku,
      variant_id: `${item.product_slug}:${item.size}`,
      name: item.name,
      description: item.name,
      quantity: item.qty,
      price: item.unit_price_paise,
      offer_price: item.unit_price_paise,
      image_url: image ? `${origin}${image.startsWith("/") ? image : `/${image}`}` : undefined,
    };
  });
  const goods = payload.items.reduce((sum, item) => sum + item.unit_price_paise * item.qty, 0);
  const extra = payload.order.total_paise - goods;
  if (extra > 0) {
    lines.push({
      sku: "PT-TAX-SHIP",
      variant_id: "tax-shipping",
      name: "GST and shipping",
      description: "GST and shipping",
      quantity: 1,
      price: extra,
      offer_price: extra,
      image_url: undefined,
    });
  }
  return lines;
}
