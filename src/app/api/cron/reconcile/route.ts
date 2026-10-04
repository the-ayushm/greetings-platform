import { requireCron } from "@/server/cron";
import { json, route } from "@/server/http";
import { log } from "@/server/log";
import { reconcile } from "@/server/orders";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = route(async (req) => {
  requireCron(req);
  const report = await reconcile();
  log.info("cron.reconcile", report);
  return json(report);
});
