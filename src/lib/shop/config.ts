export function shippingPaise() {
  const rupees = Number(process.env.SHIPPING_RUPEES ?? "0");
  return Number.isFinite(rupees) ? Math.max(0, Math.round(rupees * 100)) : 0;
}

export function stockHoldMinutes() {
  const minutes = Number(process.env.STOCK_HOLD_MINUTES ?? "5");
  return Number.isFinite(minutes) ? Math.min(60, Math.max(5, minutes)) : 5;
}

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

/** Public HTTPS origin Razorpay can fetch (product images, Magic Checkout). */
export function storefrontUrl() {
  const url = siteUrl();
  if (/localhost|127\.0\.0\.1/.test(url)) return "https://plainthread.in";
  return url;
}

export function simulatedPaymentsAllowed() {
  return (
    process.env.ALLOW_SIMULATED_PAYMENTS === "true" &&
    process.env.NODE_ENV !== "production" &&
    !razorpayKeyId()
  );
}

export function razorpayKeyId() {
  return (process.env.RAZORPAY_KEY_ID || "").trim();
}

export function razorpayKeySecret() {
  return (process.env.RAZORPAY_KEY_SECRET || "").trim();
}

export function razorpayPublicKeyId() {
  return (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
}

export function razorpayModeSetting() {
  const mode = (process.env.RAZORPAY_MODE || "").trim().toLowerCase();
  if (mode === "live" || mode === "test") return mode;
  return process.env.NODE_ENV === "production" ? "live" : "test";
}

export function razorpayKeyMode(keyId = razorpayKeyId()) {
  if (keyId.startsWith("rzp_live_")) return "live";
  if (keyId.startsWith("rzp_test_")) return "test";
  return null;
}

export function razorpayConfigError() {
  const id = razorpayKeyId();
  const secret = razorpayKeySecret();
  const pub = razorpayPublicKeyId();
  const required = razorpayModeSetting();

  if (!id || !secret || !pub) {
    return required === "live"
      ? "Live Razorpay keys are missing. Add rzp_live_ key id and secret, then restart the server."
      : "Payments are not configured yet. Add Razorpay keys to go live.";
  }
  if (id !== pub) {
    return "RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID must be the same key.";
  }
  const keyMode = razorpayKeyMode(id);
  if (!keyMode) {
    return "Razorpay key id must start with rzp_live_ or rzp_test_.";
  }
  if (required === "live" && keyMode !== "live") {
    return "Live Razorpay is enabled, but the app still has Test keys (rzp_test_). Replace them with Live keys from the Razorpay dashboard (Live mode → API Keys).";
  }
  if (required === "test" && keyMode !== "test") {
    return "RAZORPAY_MODE=test, but the keys are Live (rzp_live_). Switch the dashboard and keys to the same mode.";
  }
  return null;
}

export function razorpayConfigured() {
  return razorpayConfigError() === null;
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

export function codEnabled() {
  return process.env.COD_ENABLED === "true";
}

export function codFeePaise() {
  if (!codEnabled()) return 0;
  const paise = Number(process.env.COD_FEE_PAISE ?? "0");
  return Number.isFinite(paise) ? Math.max(0, Math.round(paise)) : 0;
}
