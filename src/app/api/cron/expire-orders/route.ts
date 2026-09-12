import { expireStaleOrders } from "@/lib/shop/orders";
import { retryUnsentPaidEmails } from "@/lib/shop/complete-payment";
import { cronAuthorized } from "@/lib/shop/cron-auth";
import { NextResponse } from "next/server";
import { errMessage, log } from "@/lib/log";

async function run(request: Request) {
  if (!cronAuthorized(request)) {
    log.info("cron", "unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireStaleOrders();
    const emailed = await retryUnsentPaidEmails();
    log.info("cron", "ran", { expired, emailed });
    return NextResponse.json({ ok: true, expired, emailed });
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
