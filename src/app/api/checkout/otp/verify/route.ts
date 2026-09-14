import { NextResponse } from "next/server";
import { smsConfigured } from "@/lib/shop/config";
import {
  consumeOtp,
  normalizeOtpDestination,
  upsertVerifySession,
  type OtpChannel,
} from "@/lib/shop/otp";
import { errMessage, log } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      channel?: OtpChannel;
      destination?: string;
      code?: string;
      sessionToken?: string;
    };
    const channel = body.channel === "phone" ? "phone" : "email";
    const destination = normalizeOtpDestination(channel, body.destination ?? "");
    if (channel === "phone" && !smsConfigured()) {
      return NextResponse.json({ error: "SMS verification is not configured yet." }, { status: 503 });
    }
    await consumeOtp(channel, destination, body.code ?? "");
    const session = await upsertVerifySession({
      token: body.sessionToken,
      email: channel === "email" ? destination : undefined,
      phone: channel === "phone" ? destination : undefined,
      emailVerified: channel === "email",
      phoneVerified: channel === "phone",
    });
    log.info("otp", "verified", { channel });
    return NextResponse.json({
      ok: true,
      sessionToken: session.token,
      emailVerified: session.email_verified,
      phoneVerified: session.phone_verified,
    });
  } catch (error) {
    log.info("otp", "verify failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify code" },
      { status: 400 },
    );
  }
}
