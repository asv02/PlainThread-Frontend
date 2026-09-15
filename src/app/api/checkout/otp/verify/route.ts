import { NextResponse } from "next/server";
import { smsConfigured } from "@/lib/shop/config";
import {
  consumeOtp,
  normalizeOtpDestination,
  upsertVerifySession,
  type OtpChannel,
} from "@/lib/shop/otp";
import { errMessage, startFlow } from "@/lib/log";

export async function POST(request: Request) {
  const flow = startFlow("otp-verify", { path: "/api/checkout/otp/verify" });
  try {
    const body = (await request.json()) as {
      channel?: OtpChannel;
      destination?: string;
      code?: string;
      sessionToken?: string;
    };
    const channel = body.channel === "phone" ? "phone" : "email";
    flow.step("channel selected", { channel, hasSession: Boolean(body.sessionToken) });
    const destination = normalizeOtpDestination(channel, body.destination ?? "");
    if (channel === "phone" && !smsConfigured()) {
      flow.fail("SMS not configured");
      return NextResponse.json({ error: "SMS verification is not configured yet." }, { status: 503 });
    }
    await consumeOtp(channel, destination, body.code ?? "");
    flow.step("otp consumed", { channel });
    const session = await upsertVerifySession({
      token: body.sessionToken,
      email: channel === "email" ? destination : undefined,
      phone: channel === "phone" ? destination : undefined,
      emailVerified: channel === "email",
      phoneVerified: channel === "phone",
    });
    flow.done("session updated", {
      channel,
      emailVerified: session.email_verified,
      phoneVerified: session.phone_verified,
    });
    return NextResponse.json({
      ok: true,
      sessionToken: session.token,
      emailVerified: session.email_verified,
      phoneVerified: session.phone_verified,
    });
  } catch (error) {
    flow.fail("verify failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify code" },
      { status: 400 },
    );
  }
}
