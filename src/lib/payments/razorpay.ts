import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { log } from "@/lib/log";
import { razorpayKeyId, razorpayKeySecret, razorpayModeSetting } from "@/lib/shop/config";

export class RazorpayRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RazorpayRequestError";
    this.status = status;
  }
}

function razorpayClient() {
  const key_id = razorpayKeyId();
  const key_secret = razorpayKeySecret();
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
  lineItems?: Array<{
    sku: string;
    variant_id: string;
    name: string;
    description: string;
    quantity: number;
    price: number;
    offer_price: number;
    image_url?: string;
  }>;
}) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new RazorpayRequestError("Amount must be at least 100 paise", 400);
  }

  try {
    const payload: Record<string, unknown> = {
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    };
    if (input.lineItems?.length) {
      payload.line_items = input.lineItems;
      payload.line_items_total = input.amountPaise;
    }
    log.info("razorpay", "create order request", {
      receipt: input.receipt,
      amountPaise: input.amountPaise,
      lineItems: input.lineItems?.length ?? 0,
      mode: razorpayModeSetting(),
    });
    const order = await razorpayClient().orders.create(
      payload as unknown as Parameters<ReturnType<typeof razorpayClient>["orders"]["create"]>[0],
    );
    if (!order.id) throw new RazorpayRequestError("Razorpay did not return an order id", 500);
    log.info("razorpay", "create order ok", {
      orderId: order.id,
      receipt: input.receipt,
      amount: Number(order.amount),
      currency: order.currency || "INR",
    });
    return {
      order_id: order.id,
      amount: Number(order.amount),
      currency: order.currency || "INR",
    };
  } catch (error) {
    if (error instanceof RazorpayRequestError) throw error;
    const status = sdkStatus(error);
    const message = sdkMessage(error);
    log.error("razorpay", "create order failed", { receipt: input.receipt, status, error: message });
    throw new RazorpayRequestError(
      status === 401 || status === 403
        ? `Razorpay rejected the ${razorpayModeSetting()} API keys. In the Razorpay dashboard, open ${razorpayModeSetting() === "live" ? "Live" : "Test"} mode → Account & Settings → API Keys, paste the new key id and secret into RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID, then restart the server.`
        : message,
      status === 401 || status === 403 ? 401 : status >= 400 && status < 500 ? status : 500,
    );
  }
}

export async function refundRazorpayPayment(
  paymentId: string,
  amountPaise: number,
  speed: "normal" | "optimum" = "normal",
) {
  log.info("razorpay", "refund request", { paymentId, amountPaise, speed });
  try {
    const refund = await razorpayClient().payments.refund(paymentId, {
      amount: amountPaise,
      speed,
    });
    if (!refund.id) throw new RazorpayRequestError("Refund failed", 500);
    log.info("razorpay", "refund ok", {
      paymentId,
      refundId: refund.id,
      amountPaise,
      speed,
      status: refund.status,
    });
    return refund.id;
  } catch (error) {
    if (error instanceof RazorpayRequestError) throw error;
    const status = sdkStatus(error);
    const message = sdkMessage(error);
    log.error("razorpay", "refund failed", { paymentId, amountPaise, speed, status, error: message });
    throw new RazorpayRequestError(
      message,
      status === 401 ? 401 : status >= 400 && status < 500 ? status : 500,
    );
  }
}

export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const secret = razorpayKeySecret();
  if (
    !secret ||
    !input.razorpayOrderId ||
    !input.razorpayPaymentId ||
    !input.razorpaySignature
  ) {
    log.info("razorpay", "checkout signature skipped", {
      hasSecret: Boolean(secret),
      hasOrderId: Boolean(input.razorpayOrderId),
      hasPaymentId: Boolean(input.razorpayPaymentId),
      hasSignature: Boolean(input.razorpaySignature),
    });
    return false;
  }
  const expected = createHmac("sha256", secret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.razorpaySignature);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  log.info("razorpay", "checkout signature", {
    razorpayOrderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    valid: ok,
  });
  return ok;
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) {
    log.info("razorpay", "webhook signature skipped", {
      hasSecret: Boolean(secret),
      hasSignature: Boolean(signature),
    });
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  log.info("razorpay", "webhook signature", { valid: ok, bytes: rawBody.length });
  return ok;
}
