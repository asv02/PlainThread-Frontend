import { NextResponse } from "next/server";
import { log } from "@/lib/log";

export async function GET() {
  log.info("magic-promotions", "apply rejected");
  return NextResponse.json(
    { error: "Coupons are not enabled on this store." },
    { status: 400 },
  );
}

export async function POST() {
  log.info("magic-promotions", "apply rejected");
  return NextResponse.json(
    { error: "Coupons are not enabled on this store." },
    { status: 400 },
  );
}
