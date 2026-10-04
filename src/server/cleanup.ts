import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { log } from "./log";
import { purgeSiteContent, removePrefix } from "./sites";

const DAY = 86_400_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

/**
 * Retention + storage hygiene (daily cron):
 *  - abandoned uploads (pending > 24 h) are deleted with their objects
 *  - sites past their 1-year lifetime become "expired" (link stops working)
 *  - expired/refunded sites are purged of all content and files after a 30-day grace period
 *  - deleted sites whose purge failed are retried
 *  - old rate-limit windows are dropped
 */
export async function cleanup() {
  const db = adminDb();
  const report = { pendingAssets: 0, expiredSites: 0, purgedSites: 0, rateLimitRows: 0, errors: 0 };

  const { data: pending } = await db.from("assets").select("id, storage_prefix").eq("status", "pending").lt("created_at", iso(DAY)).limit(500);
  for (const a of pending ?? []) {
    try {
      await removePrefix(a.storage_prefix);
      await db.from("assets").delete().eq("id", a.id);
      report.pendingAssets++;
    } catch (e) {
      report.errors++;
      log.error("cleanup.pending_failed", e, { asset: a.id });
    }
  }
  await db.from("assets").delete().in("status", ["rejected", "deleted"]).lt("updated_at", iso(30 * DAY));

  const { data: expired } = await db
    .from("sites")
    .update({ status: "expired" })
    .in("status", ["draft", "published", "unpublished"])
    .lt("expires_at", new Date().toISOString())
    .select("id");
  report.expiredSites = expired?.length ?? 0;

  const { data: toPurge } = await db.from("sites").select("id, status").in("status", ["expired", "disabled"]).lt("updated_at", iso(30 * DAY)).limit(200);
  const { data: deletedWithFiles } = await db.from("assets").select("site_id, sites!inner(status)").eq("sites.status", "deleted").limit(200);
  const ids = new Set([...(toPurge ?? []).map((s) => s.id), ...(deletedWithFiles ?? []).map((a) => a.site_id)]);
  for (const id of ids) {
    try {
      await purgeSiteContent(id);
      await db.from("sites").update({ status: "deleted", slug: null, passcode_hash: null, draft_content: {}, deleted_at: new Date().toISOString() }).eq("id", id).neq("status", "deleted");
      report.purgedSites++;
    } catch (e) {
      report.errors++;
      log.error("cleanup.purge_failed", e, { site: id });
    }
  }

  const { data: rl } = await db.from("rate_limits").delete().lt("window_start", iso(DAY)).select("key");
  report.rateLimitRows = rl?.length ?? 0;
  return report;
}
