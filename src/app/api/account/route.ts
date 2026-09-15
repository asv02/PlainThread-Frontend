import { NextResponse } from "next/server";
import { getCustomerFromCookie, listOrdersForUser } from "@/lib/shop/customers";
import { expireStaleOrders } from "@/lib/shop/orders";
import { toPublicOrder } from "@/lib/shop/serialize";
import { errMessage, log } from "@/lib/log";

export async function GET() {
  try {
    const user = await getCustomerFromCookie();
    if (!user) {
      log.info("account", "unauthorized");
      return NextResponse.json({ error: "Sign in to view your orders" }, { status: 401 });
    }
    await expireStaleOrders();
    const payloads = await listOrdersForUser(user.id);
    log.info("account", "loaded", { userId: user.id, orders: payloads.length });
    return NextResponse.json({
      user: { email: user.email, name: user.name, phone: user.phone },
      orders: payloads.map((payload) => toPublicOrder(payload)),
    });
  } catch (error) {
    log.error("account", "failed", { error: errMessage(error) });
    return NextResponse.json({ error: "Could not load account" }, { status: 500 });
  }
}
