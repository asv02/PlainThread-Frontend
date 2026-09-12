import { NextResponse } from "next/server";
import { adminCookieName, adminCookieValue } from "@/lib/shop/admin-auth";
import { timingSafeEqual } from "@/lib/shop/serialize";
import { log } from "@/lib/log";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !timingSafeEqual(body.password ?? "", expected)) {
    log.info("admin-login", "rejected");
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const token = adminCookieValue();
  if (!token) {
    return NextResponse.json({ error: "Admin is not configured" }, { status: 500 });
  }
  log.info("admin-login", "ok");
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
