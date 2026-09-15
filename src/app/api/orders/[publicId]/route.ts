import { NextResponse } from "next/server";
import { getOrderByPublicId } from "@/lib/shop/orders";
import { customerOwnsOrder, getCustomerFromCookie } from "@/lib/shop/customers";
import { timingSafeEqual, toPublicOrder } from "@/lib/shop/serialize";
import { log } from "@/lib/log";

export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  log.info("get-order", "start", { publicId, hasToken: Boolean(token) });
  const payload = await getOrderByPublicId(publicId);
  const user = await getCustomerFromCookie();
  const tokenOk = Boolean(
    payload && token && timingSafeEqual(payload.order.access_token, token),
  );
  const sessionOk = Boolean(payload && user && customerOwnsOrder(user, payload.order));
  if (!payload || (!tokenOk && !sessionOk)) {
    log.info("get-order", "not found or unauthorized", { publicId, tokenOk, sessionOk });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  log.info("get-order", "loaded", {
    publicId,
    status: payload.order.status,
    paymentStatus: payload.order.payment_status,
    paymentMethod: payload.order.payment_method,
    via: tokenOk ? "token" : "session",
  });
  return NextResponse.json({
    order: toPublicOrder(payload),
    accessToken: payload.order.access_token,
  });
}
