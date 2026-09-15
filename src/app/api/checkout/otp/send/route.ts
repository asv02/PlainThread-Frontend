import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email/send";
import { sendOtpSms } from "@/lib/sms/send";
import { smsConfigured } from "@/lib/shop/config";
import { createOtp, normalizeOtpDestination, type OtpChannel } from "@/lib/shop/otp";
import { errMessage, startFlow } from "@/lib/log";

export async function POST(request: Request) {
  const flow = startFlow("otp-send", { path: "/api/checkout/otp/send" });
  try {
    const body = (await request.json()) as { channel?: OtpChannel; destination?: string };
    const channel = body.channel === "phone" ? "phone" : "email";
    flow.step("channel selected", { channel });
    const destination = normalizeOtpDestination(channel, body.destination ?? "");
    flow.step("destination normalized", { channel });
    if (channel === "phone" && !smsConfigured()) {
      flow.fail("SMS not configured");
      return NextResponse.json({ error: "SMS verification is not configured yet." }, { status: 503 });
    }
    const code = await createOtp(channel, destination);
    flow.step("otp stored");
    if (channel === "email") await sendOtpEmail(destination, code);
    else await sendOtpSms(destination, code);
    flow.done("otp dispatched", { channel });
    return NextResponse.json({ ok: true });
  } catch (error) {
    flow.fail("send failed", { error: errMessage(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send code" },
      { status: 400 },
    );
  }
}
