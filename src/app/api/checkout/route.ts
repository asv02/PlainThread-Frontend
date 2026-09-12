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
  stockHoldMinutes,
} from "@/lib/shop/config";
import { createRazorpayOrder, RazorpayRequestError } from "@/lib/payments/razorpay";
import { toPublicOrder } from "@/lib/shop/serialize";
import type { CartLine } from "@/lib/shop/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idempotencyKey?: string;
      items?: CartLine[];
      customer?: Parameters<typeof validateCustomer>[0];
    };

    const idempotencyKey = body.idempotencyKey?.trim() ?? "";
    if (idempotencyKey.length < 8) {
      return NextResponse.json({ error: "Missing checkout key" }, { status: 400 });
    }

    const customer = validateCustomer(body.customer ?? {});
    const priced = priceCart(body.items ?? [], { destinationState: customer.state });
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

    if (payload.order.status === "paid") {
      return NextResponse.json({
        alreadyPaid: true,
        order: toPublicOrder(payload),
        accessToken: payload.order.access_token,
      });
    }

    if (!razorpayConfigured()) {
      if (!simulatedPaymentsAllowed()) {
        await cancelCustomerOrder(payload.order.id, "payments_not_configured");
        return NextResponse.json(
          { error: "Payments are not configured yet. Add Razorpay keys to go live." },
          { status: 503 },
        );
      }

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
        });
        razorpayOrderId = razorpayOrder.order_id;
        await attachRazorpayOrder(payload.order.id, razorpayOrderId);
      } catch (error) {
        await cancelCustomerOrder(payload.order.id, "razorpay_create_failed");
        throw error;
      }
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
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Checkout failed";
    const status = message.includes("sold out") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
