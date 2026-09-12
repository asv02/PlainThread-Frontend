import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";

export class RazorpayRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RazorpayRequestError";
    this.status = status;
  }
}

function razorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new RazorpayRequestError("Razorpay is not configured", 500);
  }
  return new Razorpay({ key_id, key_secret });
}

function sdkStatus(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as { statusCode?: number; status?: number };
    return value.statusCode || value.status || 500;
  }
  return 500;
}

function sdkMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "error" in error) {
    const nested = (error as { error?: { description?: string } }).error;
    if (nested?.description) return nested.description;
  }
  return "Razorpay request failed";
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new RazorpayRequestError("Amount must be at least 100 paise", 400);
  }

  try {
    const order = await razorpayClient().orders.create({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    });
    if (!order.id) throw new RazorpayRequestError("Razorpay did not return an order id", 500);
    return {
      order_id: order.id,
      amount: Number(order.amount),
      currency: order.currency || "INR",
    };
  } catch (error) {
    if (error instanceof RazorpayRequestError) throw error;
    const status = sdkStatus(error);
    throw new RazorpayRequestError(
      sdkMessage(error),
      status === 401 || status === 403 ? 401 : status >= 400 && status < 500 ? status : 500,
    );
  }
}

export async function refundRazorpayPayment(paymentId: string, amountPaise: number) {
  try {
    const refund = await razorpayClient().payments.refund(paymentId, {
      amount: amountPaise,
      speed: "optimum",
    });
    if (!refund.id) throw new RazorpayRequestError("Refund failed", 500);
    return refund.id;
  } catch (error) {
    if (error instanceof RazorpayRequestError) throw error;
    throw new RazorpayRequestError(sdkMessage(error), sdkStatus(error) === 401 ? 401 : 500);
  }
}

export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (
    !secret ||
    !input.razorpayOrderId ||
    !input.razorpayPaymentId ||
    !input.razorpaySignature
  ) {
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.razorpaySignature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
