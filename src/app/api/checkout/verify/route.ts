import { NextResponse } from "next/server";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { completeCapturedPayment, completeCodOrder } from "@/lib/shop/complete-payment";
import { getOrderByPublicId } from "@/lib/shop/orders";
import { simulatedPaymentsAllowed } from "@/lib/shop/config";
import { timingSafeEqual, toPublicOrder } from "@/lib/shop/serialize";
import { errMessage, log } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      publicId?: string;
      accessToken?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      simulate?: boolean;
      cod?: boolean;
    };

    log.debug("verify-payment", "request", {
      publicId: body.publicId,
      simulate: Boolean(body.simulate),
      hasSignature: Boolean(body.razorpay_signature),
    });

    const payload = await getOrderByPublicId(body.publicId ?? "");
    if (!payload || !timingSafeEqual(payload.order.access_token, body.accessToken ?? "")) {
      log.info("verify-payment", "order not found or token mismatch", {
        publicId: body.publicId,
      });
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (payload.order.payment_method === "cod" || payload.order.payment_status === "paid") {
      return NextResponse.json({
        result: payload.order.payment_method === "cod" ? "cod_confirmed" : "already_paid",
        order: toPublicOrder(payload),
        accessToken: payload.order.access_token,
      });
    }

    if (body.simulate) {
      if (!simulatedPaymentsAllowed()) {
        log.info("verify-payment", "simulate blocked");
        return NextResponse.json({ error: "Simulated payments are disabled" }, { status: 403 });
      }
      const result = await completeCapturedPayment(
        payload.order.id,
        `sim_${payload.order.public_id}`,
      );
      log.info("verify-payment", "simulate complete", {
        publicId: payload.order.public_id,
        result: result.result,
      });
      if (result.result === "late_payment") {
        return NextResponse.json({
          result: "late_payment",
          error:
            "This payment arrived after the order was cancelled. It is being refunded automatically.",
          order: result.payload ? toPublicOrder(result.payload) : undefined,
          accessToken: result.payload?.order.access_token,
        }, { status: 409 });
      }
      if (!result.payload) {
        log.error("verify-payment", "simulate missing payload", {
          publicId: payload.order.public_id,
        });
        return NextResponse.json({ error: "Could not confirm payment" }, { status: 409 });
      }
      return NextResponse.json({
        result: result.result,
        order: toPublicOrder(result.payload),
        accessToken: result.payload.order.access_token,
      });
    }

    const fieldsMissing =
      !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature;
    if (fieldsMissing) {
      if (body.cod) {
        const result = await completeCodOrder(
          payload.order.id,
          body.razorpay_payment_id ?? null,
        );
        if (!result.payload) {
          return NextResponse.json({ error: "Could not confirm COD order" }, { status: 409 });
        }
        return NextResponse.json({
          result: result.result,
          order: toPublicOrder(result.payload),
          accessToken: result.payload.order.access_token,
        });
      }
      log.info("verify-payment", "missing razorpay fields", { publicId: payload.order.public_id });
      return NextResponse.json(
        { error: "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature" },
        { status: 400 },
      );
    }

    const ok = verifyCheckoutSignature({
      razorpayOrderId: body.razorpay_order_id ?? "",
      razorpayPaymentId: body.razorpay_payment_id ?? "",
      razorpaySignature: body.razorpay_signature ?? "",
    });
    if (!ok) {
      log.error("verify-payment", "invalid checkout signature", {
        publicId: payload.order.public_id,
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
    if (
      payload.order.razorpay_order_id &&
      payload.order.razorpay_order_id !== body.razorpay_order_id
    ) {
      log.error("verify-payment", "razorpay order id mismatch", {
        publicId: payload.order.public_id,
      });
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    const result = await completeCapturedPayment(
      payload.order.id,
      body.razorpay_payment_id ?? "",
    );
    log.info("verify-payment", "complete", {
      publicId: payload.order.public_id,
      result: result.result,
    });
    if (result.result === "late_payment") {
      return NextResponse.json({
        result: "late_payment",
        error:
          "This payment arrived after the order was cancelled. It is being refunded automatically.",
        order: result.payload ? toPublicOrder(result.payload) : undefined,
        accessToken: result.payload?.order.access_token,
      }, { status: 409 });
    }

    if (!result.payload) {
      log.error("verify-payment", "missing payload after capture", {
        publicId: payload.order.public_id,
        result: result.result,
      });
      return NextResponse.json({ error: "Could not confirm payment" }, { status: 409 });
    }

    return NextResponse.json({
      result: result.result,
      order: toPublicOrder(result.payload),
      accessToken: result.payload.order.access_token,
    });
  } catch (error) {
    log.error("verify-payment", "failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 },
    );
  }
}
