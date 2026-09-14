import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email/send";
import { sendOtpSms } from "@/lib/sms/send";
import { smsConfigured } from "@/lib/shop/config";
import { createOtp, normalizeOtpDestination, type OtpChannel } from "@/lib/shop/otp";
import { errMessage, log } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { channel?: OtpChannel; destination?: string };
    const channel = body.channel === "phone" ? "phone" : "email";
    const destination = normalizeOtpDestination(channel, body.destination ?? "");
    if (channel === "phone" && !smsConfigured()) {
      return NextResponse.json({ error: "SMS verification is not configured yet." }, { status: 503 });
    }
    const code = await createOtp(channel, destination);
    if (channel === "email") await sendOtpEmail(destination, code);
    else await sendOtpSms(destination, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.info("otp", "send failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send code" },
      { status: 400 },
    );
  }
}
