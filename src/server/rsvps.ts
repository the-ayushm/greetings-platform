import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { applyRsvpRules, rsvpNameKey, type RsvpInput, type WeddingContent } from "@/templates/wedding/schema";
import { rsvpClosesAt } from "@/templates/wedding/time";
import { badRequest, conflict, notFound } from "./http";
import { log } from "./log";
import { getOwnedSite, type PublicSite } from "./sites";

/** Upper bound per invitation, so a shared link can't be used to fill the database. */
const MAX_PER_SITE = 1000;

/**
 * Stores a guest's reply to a PUBLISHED wedding invitation. Everything is re-checked against
 * the published content: RSVPs switched on, still open, guest limit, message allowed. One
 * reply per guest name (normalised), so the same guest isn't counted twice.
 */
export async function recordRsvp(site: PublicSite, input: RsvpInput): Promise<{ ok: true }> {
  if (site.templateKey !== "wedding") throw notFound();
  const c = site.content as WeddingContent;
  if (!c.sections.rsvp) throw conflict("rsvp_off", "This invitation isn't taking replies.");
  const closes = rsvpClosesAt(c);
  if (closes && Date.now() > closes.getTime()) throw conflict("rsvp_closed", "RSVPs for this wedding are closed.");
  const ruled = applyRsvpRules(c, input);
  if ("error" in ruled) throw badRequest(ruled.error);
  const row = ruled.row;

  const db = adminDb();
  const { count } = await db.from("site_rsvps").select("id", { count: "exact", head: true }).eq("site_id", site.id);
  if ((count ?? 0) >= MAX_PER_SITE) {
    log.warn("rsvps.site_full", { site: site.id });
    throw conflict("full", "This invitation can't take more replies right now. Please contact the couple.");
  }
  const { error } = await db.from("site_rsvps").insert({
    site_id: site.id,
    guest_name: row.name,
    name_key: rsvpNameKey(row.name).slice(0, 80),
    attending: row.attending,
    guests: row.guests,
    message: row.message,
  });
  if (error?.code === "23505") throw conflict("already_replied", "We already have a reply under this name. If you need to change it, please contact the couple.");
  if (error) throw error;
  return { ok: true };
}

/** Owner removes one reply (e.g. so a guest can answer again), or all of them. */
export async function deleteRsvps(userId: string, siteId: string, rsvpId: string | null) {
  await getOwnedSite(userId, siteId);
  let q = adminDb().from("site_rsvps").delete().eq("site_id", siteId);
  if (rsvpId) q = q.eq("id", rsvpId);
  const { data, error } = await q.select("id");
  if (error) throw error;
  await adminDb()
    .from("audit_log")
    .insert({ actor_id: userId, actor_role: "customer", action: "site.rsvps_deleted", target_type: "site", target_id: siteId, meta: { count: data?.length ?? 0 } });
  return { deleted: data?.length ?? 0 };
}
