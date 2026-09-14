import { log } from "@/lib/log";

export async function sendOtpSms(phone: string, code: string) {
  const message = `Your Plain Thread checkout code is ${code}. It expires in 10 minutes.`;
  const authKey = process.env.MSG91_AUTH_KEY ?? "";
  const templateId = process.env.MSG91_TEMPLATE_ID ?? "";

  if (authKey && templateId) {
    const res = await fetch("https://control.msg91.com/api/v5/otp?otp_expiry=10", {
      method: "POST",
      headers: {
        authkey: authKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: `91${phone}`,
        otp: code,
      }),
    });
    if (!res.ok) {
      log.error("sms", "msg91 failed", { status: res.status });
      throw new Error("Could not send SMS");
    }
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";
  const from = process.env.TWILIO_FROM ?? "";
  if (!sid || !token || !from) throw new Error("SMS is not configured");

  const body = new URLSearchParams({
    To: `+91${phone}`,
    From: from,
    Body: message,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    log.error("sms", "twilio failed", { status: res.status });
    throw new Error("Could not send SMS");
  }
}
