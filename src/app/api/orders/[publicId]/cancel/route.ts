import { NextResponse } from "next/server";
import { refundRazorpayPayment } from "@/lib/payments/razorpay";
import { razorpayConfigured } from "@/lib/shop/config";
import {
  cancelCustomerOrder,
  finalizeRefundCancel,
  getOrderByPublicId,
} from "@/lib/shop/orders";
import { timingSafeEqual, toPublicOrder } from "@/lib/shop/serialize";

export async function POST(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await context.params;
    const body = (await request.json()) as {
      accessToken?: string;
      reason?: string;
    };
    const payload = await getOrderByPublicId(publicId);
    if (!payload || !timingSafeEqual(payload.order.access_token, body.accessToken ?? "")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await cancelCustomerOrder(
      payload.order.id,
      body.reason || "customer_cancelled",
    );

    if (result.result === "needs_refund") {
      const paymentId = result.razorpay_payment_id;
      if (paymentId && razorpayConfigured() && !paymentId.startsWith("sim_")) {
        await refundRazorpayPayment(paymentId, payload.order.total_paise);
      }
      const refunded = await finalizeRefundCancel(payload.order.id);
      return NextResponse.json({
        result: refunded.result,
        order: refunded.payload ? toPublicOrder(refunded.payload) : undefined,
        accessToken: refunded.payload?.order.access_token,
      });
    }

    return NextResponse.json({
      result: result.result,
      order: result.payload ? toPublicOrder(result.payload) : undefined,
      accessToken: result.payload?.order.access_token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cancel failed" },
      { status: 400 },
    );
  }
}
