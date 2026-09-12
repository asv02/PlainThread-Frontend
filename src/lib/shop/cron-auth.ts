import { timingSafeEqual } from "@/lib/shop/serialize";

export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  return timingSafeEqual(token, secret);
}
