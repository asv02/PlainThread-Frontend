export function shippingPaise() {
  const rupees = Number(process.env.SHIPPING_RUPEES ?? "0");
  return Number.isFinite(rupees) ? Math.max(0, Math.round(rupees * 100)) : 0;
}

export function stockHoldMinutes() {
  const minutes = Number(process.env.STOCK_HOLD_MINUTES ?? "15");
  return Number.isFinite(minutes) ? Math.min(60, Math.max(5, minutes)) : 15;
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
