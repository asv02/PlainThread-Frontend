import { NextResponse } from "next/server";
import { deleteCustomerSession } from "@/lib/shop/customers";
import { log } from "@/lib/log";

export async function POST() {
  await deleteCustomerSession();
  log.info("account-logout", "ok");
  return NextResponse.json({ ok: true });
}
