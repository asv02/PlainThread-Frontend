import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Coupons are not enabled on this store." },
    { status: 400 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Coupons are not enabled on this store." },
    { status: 400 },
  );
}
