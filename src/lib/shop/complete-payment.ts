import { refundRazorpayPayment } from "@/lib/payments/razorpay";
import { sendPaidOrderEmails } from "@/lib/email/send";
import {
  confirmCodOrder,
  getOrderPayloadById,
  listOrdersNeedingPaidEmail,
  markOrderPaid,
} from "@/lib/shop/orders";
import { razorpayConfigured } from "@/lib/shop/config";
import { isConfirmedOrder } from "@/lib/shop/serialize";
import type { OrderPayload } from "@/lib/shop/types";
import { errMessage, log } from "@/lib/log";

function storedPaymentId(result: {
  razorpay_payment_id?: string | null;
  payload?: OrderPayload;
}) {
  return result.razorpay_payment_id || result.payload?.order.razorpay_payment_id || null;
}

async function refundCapturedPayment(paymentId: string, amountPaise: number | undefined) {
  if (!razorpayConfigured() || !paymentId || paymentId.startsWith("sim_") || !amountPaise) {
    return;
  }
  await refundRazorpayPayment(paymentId, amountPaise);
}

export async function deliverPaidOrderEmails(orderId: string) {
  const payload = await getOrderPayloadById(orderId);
  if (!payload || !isConfirmedOrder(payload.order)) return;
  await sendPaidOrderEmails(payload);
}

export async function retryUnsentPaidEmails() {
  let orders;
  try {
    orders = await listOrdersNeedingPaidEmail(20);
  } catch (error) {
    log.error("complete-payment", "paid email retry skipped", { error: errMessage(error) });
    return 0;
  }
  for (const order of orders) {
    try {
      await deliverPaidOrderEmails(order.id);
    } catch (error) {
      log.error("complete-payment", "paid email retry failed", {
        publicId: order.public_id,
        error: errMessage(error),
      });
    }
  }
  return orders.length;
}

export async function completeCodOrder(orderId: string, paymentId: string | null) {
  log.debug("complete-payment", "cod start", { orderId, paymentId });
  const result = await confirmCodOrder(orderId, paymentId);
  log.info("complete-payment", "cod result", {
    orderId,
    result: result.result,
    publicId: result.payload?.order.public_id,
  });
  if (result.result === "cod_confirmed" || result.result === "already_cod") {
    try {
      await deliverPaidOrderEmails(orderId);
    } catch (error) {
      log.error("complete-payment", "cod emails failed", { error: errMessage(error), orderId });
    }
  }
  return result;
}

export async function completeCapturedPayment(orderId: string, paymentId: string) {
  log.debug("complete-payment", "start", { orderId, paymentId });
  const result = await markOrderPaid(orderId, paymentId);
  const payload = result.payload;
  const amountPaise = payload?.order.total_paise;
  const existingPaymentId = storedPaymentId(result);
  log.info("complete-payment", "mark result", {
    orderId,
    result: result.result,
    publicId: payload?.order.public_id,
  });

  if (result.result === "paid" || result.result === "already_paid") {
    try {
      await deliverPaidOrderEmails(orderId);
    } catch (error) {
      log.error("complete-payment", "payment emails failed", { error: errMessage(error), orderId });
    }
  }

  if (
    result.result === "already_paid" &&
    paymentId &&
    existingPaymentId &&
    paymentId !== existingPaymentId
  ) {
    try {
      await refundCapturedPayment(paymentId, amountPaise);
    } catch (error) {
      log.error("complete-payment", "duplicate capture refund failed", {
        error: errMessage(error),
        paymentId,
      });
    }
  }

  if (result.result === "late_payment") {
    try {
      await refundCapturedPayment(paymentId, amountPaise);
    } catch (error) {
      log.error("complete-payment", "late payment refund failed", {
        error: errMessage(error),
        paymentId,
      });
    }
  }

  return result;
}
