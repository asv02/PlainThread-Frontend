import { timingSafeEqual } from "@/lib/shop/serialize";
import { log } from "@/lib/log";

export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) {
    log.error("cron-auth", "CRON_SECRET is empty");
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    log.info("cron-auth", "missing bearer token");
    return false;
  }
  return timingSafeEqual(token, secret);
}
