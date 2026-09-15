import { NextResponse } from "next/server";
import { smsConfigured } from "@/lib/shop/config";
import { log } from "@/lib/log";

export async function GET() {
  const phone = smsConfigured();
  log.info("otp-config", "capabilities", { email: true, phone });
  return NextResponse.json({
    email: true,
    phone,
  });
}
