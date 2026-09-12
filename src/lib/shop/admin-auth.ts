import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "pt_admin";

function expectedToken() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("plain-thread-admin").digest("hex");
}

export async function isAdmin() {
  const expected = expectedToken();
  if (!expected) return false;
  const token = (await cookies()).get(COOKIE)?.value ?? "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminCookieValue() {
  return expectedToken();
}

export const adminCookieName = COOKIE;
