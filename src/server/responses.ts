import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { respondableItem, type LoveContent } from "@/templates/lovestory/schema";
import { cleanText } from "@/templates/scrapbook/schema";
import { conflict, notFound } from "./http";
import { log } from "./log";
import { getOwnedSite, type PublicSite } from "./sites";

/** Upper bound per site, so a shared link can't be used to fill the database. */
const MAX_PER_SITE = 300;

export type ResponseKind = "text" | "slider" | "coupon";

/**
 * Stores a recipient's answer — only when the published story has response collection on and
 * the item exists in the PUBLISHED content. The label is taken from that content, never from
 * the request. Returns false (silently) when collection is off, so the page can say so.
 */
export async function recordResponse(site: PublicSite, kind: ResponseKind, itemId: string, rawValue: string): Promise<{ stored: boolean }> {
  if (site.templateKey !== "lovestory") throw notFound();
  const content = site.content as LoveContent;
  if (!content.responses.collect) return { stored: false };
  const label = respondableItem(content, kind, itemId);
  if (label === null) throw notFound();

  let value = cleanText(rawValue, kind === "text").slice(0, 1000);
  if (kind === "slider") {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 100) throw notFound();
    value = String(n);
  }
  if (kind === "coupon") value = "redeemed";
  if (!value) return { stored: false };

  const db = adminDb();
  const { count } = await db.from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", site.id);
  if ((count ?? 0) >= MAX_PER_SITE) {
    log.warn("responses.site_full", { site: site.id });
    throw conflict("full", "This page can't take more answers right now.");
  }
  const { error } = await db.from("site_responses").insert({ site_id: site.id, kind, item_id: itemId, label: label.slice(0, 160), value });
  if (error) throw error;
  return { stored: true };
}

/** Owner clears one response, or all of them. */
export async function deleteResponses(userId: string, siteId: string, responseId: string | null) {
  await getOwnedSite(userId, siteId);
  let q = adminDb().from("site_responses").delete().eq("site_id", siteId);
  if (responseId) q = q.eq("id", responseId);
  const { data, error } = await q.select("id");
  if (error) throw error;
  await adminDb()
    .from("audit_log")
    .insert({ actor_id: userId, actor_role: "customer", action: "site.responses_deleted", target_type: "site", target_id: siteId, meta: { count: data?.length ?? 0 } });
  return { deleted: data?.length ?? 0 };
}
