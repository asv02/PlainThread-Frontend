import { refundRazorpayPayment } from "@/lib/payments/razorpay";
import { sendPaidOrderEmails } from "@/lib/email/send";
import { getOrderPayloadById, listOrdersNeedingPaidEmail, markOrderPaid } from "@/lib/shop/orders";
import { razorpayConfigured } from "@/lib/shop/config";
import type { OrderPayload } from "@/lib/shop/types";

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
  if (!payload) return;
  const status = payload.order.status;
  if (!["paid", "packed", "shipped", "delivered"].includes(status)) return;
  await sendPaidOrderEmails(payload);
}

export async function retryUnsentPaidEmails() {
  let orders;
  try {
    orders = await listOrdersNeedingPaidEmail(20);
  } catch (error) {
    console.error("paid email retry skipped", error);
    return 0;
  }
  for (const order of orders) {
    try {
      await deliverPaidOrderEmails(order.id);
    } catch (error) {
      console.error("paid email retry failed", order.public_id, error);
    }
  }
  return orders.length;
}

export async function completeCapturedPayment(orderId: string, paymentId: string) {
  const result = await markOrderPaid(orderId, paymentId);
  const payload = result.payload;
  const amountPaise = payload?.order.total_paise;
  const existingPaymentId = storedPaymentId(result);

  if (result.result === "paid" || result.result === "already_paid") {
    try {
      await deliverPaidOrderEmails(orderId);
    } catch (error) {
      console.error("payment emails failed", error);
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
      console.error("duplicate capture refund failed", error);
    }
  }

  if (result.result === "late_payment") {
    try {
      await refundCapturedPayment(paymentId, amountPaise);
    } catch (error) {
      console.error("late payment refund failed", error);
    }
  }

  return result;
}
