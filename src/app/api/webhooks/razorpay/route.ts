import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { completeCapturedPayment, completeCodOrder } from "@/lib/shop/complete-payment";
import {
  getOrderByRazorpayOrderId,
  markPaymentFailed,
  recordPaymentEvent,
} from "@/lib/shop/orders";
import { errMessage, log } from "@/lib/log";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature)) {
    log.error("razorpay-webhook", "invalid signature");
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

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
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    log.error("razorpay-webhook", "invalid json");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;
  const method = payment?.method;
  const isCod =
    method === "cod" ||
    event.event === "payment.pending" ||
    event.event === "order.placed";

  log.info("razorpay-webhook", "event", {
    event: event.event,
    razorpayOrderId,
    paymentId: payment?.id,
    paymentStatus: payment?.status,
    method,
  });

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
    log.debug("razorpay-webhook", "duplicate event", {
      event: event.event,
      publicId: order?.order.public_id,
    });
    if (order && isCod) {
      try {
        await completeCodOrder(order.order.id, payment?.id ?? null);
      } catch (error) {
        log.error("razorpay-webhook", "duplicate cod handling failed", {
          error: errMessage(error),
          publicId: order.order.public_id,
        });
      }
    } else if (
      order &&
      payment?.id &&
      (event.event === "payment.captured" || event.event === "order.paid")
    ) {
      try {
        await completeCapturedPayment(order.order.id, payment.id);
      } catch (error) {
        log.error("razorpay-webhook", "duplicate capture handling failed", {
          error: errMessage(error),
          publicId: order.order.public_id,
        });
      }
    }
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!order) {
    log.info("razorpay-webhook", "no matching order; ignored", { razorpayOrderId });
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (isCod && (event.event === "payment.pending" || event.event === "order.placed" || method === "cod")) {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      log.info("razorpay-webhook", "ignored capture on COD", {
        publicId: order.order.public_id,
      });
      return NextResponse.json({ ok: true, ignored: true });
    }
    try {
      const result = await completeCodOrder(order.order.id, payment?.id ?? null);
      log.info("razorpay-webhook", "cod handled", {
        publicId: order.order.public_id,
        result: result.result,
      });
    } catch (error) {
      log.error("razorpay-webhook", "cod failed", {
        publicId: order.order.public_id,
        error: errMessage(error),
      });
      throw error;
    }
    return NextResponse.json({ ok: true });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    if (payment?.id) {
      try {
        const result = await completeCapturedPayment(order.order.id, payment.id);
        log.info("razorpay-webhook", "capture handled", {
          publicId: order.order.public_id,
          result: result.result,
        });
      } catch (error) {
        log.error("razorpay-webhook", "capture failed", {
          publicId: order.order.public_id,
          error: errMessage(error),
        });
        throw error;
      }
    } else {
      log.info("razorpay-webhook", "paid event without payment id", {
        publicId: order.order.public_id,
        event: event.event,
      });
    }
  }

  if (event.event === "payment.failed") {
    await markPaymentFailed(
      order.order.id,
      payment?.error_description || "Payment failed",
    );
    log.info("razorpay-webhook", "payment marked failed", {
      publicId: order.order.public_id,
    });
  }

  return NextResponse.json({ ok: true });
}
