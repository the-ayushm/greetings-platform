import "server-only";
import { safeEqual } from "./crypto";
import { env } from "./env";
import { ApiError } from "./http";

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". */
export function requireCron(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  if (!safeEqual(h, `Bearer ${env().CRON_SECRET}`)) throw new ApiError(401, "unauthorized", "Unauthorized.");
}
