import { expireStaleOrders } from "@/lib/shop/orders";
import { retryPendingRefunds, retryUnsentPaidEmails } from "@/lib/shop/complete-payment";
import { cronAuthorized } from "@/lib/shop/cron-auth";
import { NextResponse } from "next/server";
import { errMessage, log } from "@/lib/log";

async function run(request: Request) {
  if (!cronAuthorized(request)) {
    log.info("cron", "unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log.info("cron", "start", { path: "/api/cron/expire-orders" });
  try {
    log.info("cron", "expire stale holds");
    const expired = await expireStaleOrders();
    log.info("cron", "retry unpaid emails");
    const emailed = await retryUnsentPaidEmails();
    log.info("cron", "retry pending refunds");
    const refunded = await retryPendingRefunds();
    log.info("cron", "done", { expired, emailed, refunded });
    return NextResponse.json({ ok: true, expired, emailed, refunded });
  } catch (error) {
    log.error("cron", "failed", { error: errMessage(error) });
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
