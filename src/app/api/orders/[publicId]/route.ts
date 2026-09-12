import { NextResponse } from "next/server";
import { getOrderByPublicId } from "@/lib/shop/orders";
import { timingSafeEqual, toPublicOrder } from "@/lib/shop/serialize";

export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const payload = await getOrderByPublicId(publicId);
  if (!payload || !timingSafeEqual(payload.order.access_token, token)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({
    order: toPublicOrder(payload),
    accessToken: payload.order.access_token,
  });
}
