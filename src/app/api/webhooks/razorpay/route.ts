import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { completeCapturedPayment } from "@/lib/shop/complete-payment";
import {
  getOrderByRazorpayOrderId,
  markPaymentFailed,
  recordPaymentEvent,
} from "@/lib/shop/orders";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; error_description?: string; status?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;
  const order = razorpayOrderId
    ? await getOrderByRazorpayOrderId(razorpayOrderId)
    : null;

  const eventId =
    request.headers.get("x-razorpay-event-id") ||
    `${event.event || "unknown"}:${payment?.id || razorpayOrderId || Date.now()}`;

  const recorded = await recordPaymentEvent({
    orderId: order?.order.id,
    eventType: event.event || "unknown",
    providerEventId: eventId,
    payload: event,
  });
  if (recorded.duplicate) {
    if (
      order &&
      payment?.id &&
      (event.event === "payment.captured" || event.event === "order.paid")
    ) {
      await completeCapturedPayment(order.order.id, payment.id);
    }
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!order) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment?.id) {
      await completeCapturedPayment(order.order.id, payment.id);
    }
  }

  if (event.event === "payment.failed") {
    await markPaymentFailed(
      order.order.id,
      payment?.error_description || "Payment failed",
    );
  }

  return NextResponse.json({ ok: true });
}
