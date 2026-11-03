import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { answerSummary, fillTokens, type AskContent } from "@/templates/doyouloveme/schema";
import { respondableItem, type LoveContent } from "@/templates/lovestory/schema";
import { cleanText } from "@/templates/scrapbook/schema";
import { conflict, notFound } from "./http";
import { log } from "./log";
import { getOwnedSite, type PublicSite } from "./sites";

/** Upper bound per site, so a shared link can't be used to fill the database. */
const MAX_PER_SITE = 300;

export type ResponseKind = "text" | "slider" | "coupon" | "answer";

/**
 * Stores a recipient's answer — only when the published page has response collection on and
 * the item exists in the PUBLISHED content. The label is taken from that content, never from
 * the request. Returns false (silently) when collection is off, so the page can say so.
 */
export async function recordResponse(site: PublicSite, kind: ResponseKind, itemId: string, rawValue: string): Promise<{ stored: boolean }> {
  if (site.templateKey === "doyouloveme") return recordAnswer(site, kind, itemId, rawValue);
  if (site.templateKey !== "lovestory" || kind === "answer") throw notFound();
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
  return insertResponse(site.id, kind, itemId, label, value);
}

/**
 * "Do You Love Me?": they pressed Yes. The request only carries how many times they pressed No
 * (capped by the published "No" list); the question label and the wording are built here.
 */
async function recordAnswer(site: PublicSite, kind: ResponseKind, itemId: string, rawValue: string): Promise<{ stored: boolean }> {
  if (kind !== "answer" || itemId !== "answer") throw notFound();
  const content = site.content as AskContent;
  if (!content.responses.notify) return { stored: false };
  const n = Number(rawValue);
  if (!Number.isInteger(n) || n < 0 || n > 1000) throw notFound();
  const presses = Math.min(n, content.question.noMessages.length);
  return insertResponse(site.id, "answer", "answer", fillTokens(content.question.text, content), answerSummary(presses));
}

async function insertResponse(siteId: string, kind: ResponseKind, itemId: string, label: string, value: string): Promise<{ stored: boolean }> {
  const db = adminDb();
  const { count } = await db.from("site_responses").select("id", { count: "exact", head: true }).eq("site_id", siteId);
  if ((count ?? 0) >= MAX_PER_SITE) {
    log.warn("responses.site_full", { site: siteId });
    throw conflict("full", "This page can't take more answers right now.");
  }
  const { error } = await db.from("site_responses").insert({ site_id: siteId, kind, item_id: itemId, label: label.slice(0, 160), value });
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
