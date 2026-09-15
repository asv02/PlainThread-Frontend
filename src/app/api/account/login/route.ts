import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeOtp, normalizeOtpDestination } from "@/lib/shop/otp";
import {
  createCustomerSession,
  customerCookieName,
  customerCookieOptions,
  upsertCustomer,
} from "@/lib/shop/customers";
import { errMessage, startFlow } from "@/lib/log";

export async function POST(request: Request) {
  const flow = startFlow("account-login", { path: "/api/account/login" });
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = normalizeOtpDestination("email", body.email ?? "");
    flow.step("email normalized");
    await consumeOtp("email", email, body.code ?? "");
    flow.step("otp consumed");
    const userId = await upsertCustomer({ email });
    const session = await createCustomerSession(userId);
    (await cookies()).set(
      customerCookieName,
      session.token,
      customerCookieOptions(session.expiresAt),
    );
    flow.done("logged in", { userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    flow.fail("login failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sign in" },
      { status: 400 },
    );
  }
}
