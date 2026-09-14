import { NextResponse } from "next/server";
import { smsConfigured } from "@/lib/shop/config";

export async function GET() {
  return NextResponse.json({
    email: true,
    phone: smsConfigured(),
  });
}
