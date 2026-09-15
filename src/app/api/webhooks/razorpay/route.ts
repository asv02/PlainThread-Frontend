import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { completeCapturedPayment } from "@/lib/shop/complete-payment";
import {
  finalizeRefundCancel,
  getOrderByRazorpayOrderId,
  getOrderByRazorpayPaymentId,
  markPaymentFailed,
  recordPaymentEvent,
} from "@/lib/shop/orders";
import { errMessage, startFlow } from "@/lib/log";

export async function POST(request: Request) {
  const flow = startFlow("razorpay-webhook", { path: "/api/webhooks/razorpay" });
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  flow.step("payload received", {
    bytes: rawBody.length,
    hasSignature: Boolean(signature),
    eventHeader: request.headers.get("x-razorpay-event-id"),
  });

  if (!verifyWebhookSignature(rawBody, signature)) {
    flow.fail("invalid webhook HMAC");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  flow.step("webhook HMAC valid");

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          error_description?: string;
          status?: string;
          method?: string;
        };
      };
      refund?: {
        entity?: {
          id?: string;
          payment_id?: string;
          status?: string;
        };
      };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    flow.fail("invalid json");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;
  const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;
  const method = payment?.method;
  const isCodConfirmEvent =
    event.event === "payment.pending" || event.event === "order.placed";
  const isCodMethod =
    method === "cod" &&
    event.event !== "payment.failed" &&
    event.event !== "payment.captured" &&
    event.event !== "order.paid";
  const isCod = isCodConfirmEvent || isCodMethod;

  flow.step("event classified", {
    event: event.event,
    razorpayOrderId,
    paymentId: payment?.id,
    paymentStatus: payment?.status,
    method,
    isCod,
  });

  const order = razorpayOrderId
    ? await getOrderByRazorpayOrderId(razorpayOrderId)
    : refund?.payment_id
      ? await getOrderByRazorpayPaymentId(refund.payment_id)
      : null;
  flow.step(order ? "matched local order" : "no local order for Razorpay id", {
    publicId: order?.order.public_id,
    localStatus: order?.order.status,
    localPaymentStatus: order?.order.payment_status,
  });

  const eventId =
    request.headers.get("x-razorpay-event-id") ||
    `${event.event || "unknown"}:${payment?.id || refund?.id || razorpayOrderId || Date.now()}`;

  const recorded = await recordPaymentEvent({
    orderId: order?.order.id,
    eventType: event.event || "unknown",
    providerEventId: eventId,
    payload: event,
  });
  flow.step("payment_events insert", {
    duplicate: recorded.duplicate,
    eventId,
  });

  if (recorded.duplicate) {
    if (
      order &&
      payment?.id &&
      (event.event === "payment.captured" || event.event === "order.paid") &&
      method !== "cod"
    ) {
      flow.step("duplicate capture event; re-run mark paid");
      try {
        await completeCapturedPayment(order.order.id, payment.id);
      } catch (error) {
        flow.fail("duplicate capture handling failed", {
          error: errMessage(error),
          publicId: order.order.public_id,
        });
      }
    }
    flow.done("duplicate event acknowledged", {
      event: event.event,
      publicId: order?.order.public_id,
    });
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!order) {
    flow.done("ignored: no matching order", { razorpayOrderId, event: event.event });
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (isCod && (event.event === "payment.pending" || event.event === "order.placed" || method === "cod")) {
    flow.done("ignored COD; cash on delivery is disabled", {
      publicId: order.order.public_id,
      event: event.event,
      method,
    });
    return NextResponse.json({ ok: true, ignored: true, reason: "cod_disabled" });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment?.id) {
      try {
        flow.step("captured/paid; marking local order paid", {
          publicId: order.order.public_id,
          paymentId: payment.id,
        });
        const result = await completeCapturedPayment(order.order.id, payment.id);
        flow.done("capture handled", {
          publicId: order.order.public_id,
          result: result.result,
        });
      } catch (error) {
        flow.fail("capture failed", {
          publicId: order.order.public_id,
          error: errMessage(error),
        });
        throw error;
      }
    } else {
      flow.done("paid event without payment id", {
        publicId: order.order.public_id,
        event: event.event,
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (event.event === "payment.failed") {
    flow.step("marking payment failed", { publicId: order.order.public_id });
    await markPaymentFailed(
      order.order.id,
      payment?.error_description || "Payment failed",
    );
    flow.done("payment marked failed", {
      publicId: order.order.public_id,
      reason: payment?.error_description || "Payment failed",
    });
    return NextResponse.json({ ok: true });
  }

  if (
    (event.event === "refund.processed" || event.event === "refund.created") &&
    order.order.payment_status === "refund_pending"
  ) {
    const refunded = await finalizeRefundCancel(order.order.id);
    flow.done("dashboard or provider refund applied", {
      publicId: order.order.public_id,
      result: refunded.result,
      event: event.event,
      refundId: refund?.id,
    });
    return NextResponse.json({ ok: true, result: refunded.result });
  }

  flow.done("event stored; no status change", {
    publicId: order.order.public_id,
    event: event.event,
  });
  return NextResponse.json({ ok: true });
}
