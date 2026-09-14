export function shippingPaise() {
  const rupees = Number(process.env.SHIPPING_RUPEES ?? "0");
  return Number.isFinite(rupees) ? Math.max(0, Math.round(rupees * 100)) : 0;
}

export function stockHoldMinutes() {
  const minutes = Number(process.env.STOCK_HOLD_MINUTES ?? "2");
  return Number.isFinite(minutes) ? Math.min(60, Math.max(2, minutes)) : 2;
}

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export function simulatedPaymentsAllowed() {
  return (
    process.env.ALLOW_SIMULATED_PAYMENTS === "true" &&
    process.env.NODE_ENV !== "production" &&
    !process.env.RAZORPAY_KEY_ID
  );
}

export function razorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  );
}

export function smsConfigured() {
  return Boolean(
    (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
  );
}

export function otpSecret() {
  return process.env.OTP_SECRET || process.env.ADMIN_PASSWORD || process.env.RAZORPAY_KEY_SECRET || "";
}

export function codFeePaise() {
  const paise = Number(process.env.COD_FEE_PAISE ?? "0");
  return Number.isFinite(paise) ? Math.max(0, Math.round(paise)) : 0;
}
