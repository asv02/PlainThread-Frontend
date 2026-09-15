import fs from "fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    let value = trimmed.slice(idx + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value.trim();
  }
}

const id = (process.env.RAZORPAY_KEY_ID || "").trim();
const secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
const pub = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
const required = (process.env.RAZORPAY_MODE || "").trim().toLowerCase() || "unset";
const keyMode = id.startsWith("rzp_live_") ? "live" : id.startsWith("rzp_test_") ? "test" : id ? "invalid" : "missing";

console.log(
  JSON.stringify({
    RAZORPAY_MODE: required,
    keyMode,
    keyIdPrefix: id.slice(0, 8) || null,
    publicMatches: id === pub && Boolean(id),
    secretLen: secret.length,
  }),
);

const problems = [];
if (!id || !secret || !pub) problems.push("missing_keys");
if (id && pub && id !== pub) problems.push("public_key_mismatch");
if (required === "live" && keyMode !== "live") problems.push("expected_live_keys");
if (required === "test" && keyMode !== "test") problems.push("expected_test_keys");

if (problems.length) {
  console.error("config_failed", problems.join(", "));
  process.exit(1);
}

const auth = Buffer.from(`${id}:${secret}`).toString("base64");
const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
  headers: { Authorization: `Basic ${auth}` },
});
const text = await res.text();
let description = "";
try {
  const parsed = JSON.parse(text);
  description = parsed.error?.description || "";
} catch {
  description = text.slice(0, 120);
}

if (!res.ok) {
  console.error("api_failed", { status: res.status, description: description || res.statusText });
  process.exit(1);
}

console.log("razorpay_live_ok", { status: res.status, mode: keyMode });
