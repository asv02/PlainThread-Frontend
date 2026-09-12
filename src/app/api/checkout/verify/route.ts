import { NextResponse } from "next/server";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { completeCapturedPayment } from "@/lib/shop/complete-payment";
import { getOrderByPublicId } from "@/lib/shop/orders";
import { simulatedPaymentsAllowed } from "@/lib/shop/config";
import { timingSafeEqual, toPublicOrder } from "@/lib/shop/serialize";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      publicId?: string;
      accessToken?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      simulate?: boolean;
    };

    const payload = await getOrderByPublicId(body.publicId ?? "");
    if (!payload || !timingSafeEqual(payload.order.access_token, body.accessToken ?? "")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (body.simulate) {
      if (!simulatedPaymentsAllowed()) {
        return NextResponse.json({ error: "Simulated payments are disabled" }, { status: 403 });
      }
      const result = await completeCapturedPayment(
        payload.order.id,
        `sim_${payload.order.public_id}`,
      );
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
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
    if (
      payload.order.razorpay_order_id &&
      payload.order.razorpay_order_id !== body.razorpay_order_id
    ) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    const result = await completeCapturedPayment(
      payload.order.id,
      body.razorpay_payment_id ?? "",
    );
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
      return NextResponse.json({ error: "Could not confirm payment" }, { status: 409 });
    }

    return NextResponse.json({
      result: result.result,
      order: toPublicOrder(result.payload),
      accessToken: result.payload.order.access_token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 },
    );
  }
}
