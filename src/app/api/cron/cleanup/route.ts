import { cleanup } from "@/server/cleanup";
import { requireCron } from "@/server/cron";
import { json, route } from "@/server/http";
import { log } from "@/server/log";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = route(async (req) => {
  requireCron(req);
  const report = await cleanup();
  log.info("cron.cleanup", report);
  return json(report);
});
