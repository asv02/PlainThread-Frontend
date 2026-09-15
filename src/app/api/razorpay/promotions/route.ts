import { NextResponse } from "next/server";
import { log } from "@/lib/log";

export async function GET() {
  log.info("magic-promotions", "list empty");
  return NextResponse.json({ promotions: [] });
}

export async function POST() {
  log.info("magic-promotions", "list empty");
  return NextResponse.json({ promotions: [] });
}
