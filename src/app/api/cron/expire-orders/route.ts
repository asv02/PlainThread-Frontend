import { expireStaleOrders } from "@/lib/shop/orders";
import { retryUnsentPaidEmails } from "@/lib/shop/complete-payment";
import { cronAuthorized } from "@/lib/shop/cron-auth";
import { NextResponse } from "next/server";

async function run(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireStaleOrders();
  const emailed = await retryUnsentPaidEmails();
  return NextResponse.json({ ok: true, expired, emailed });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
