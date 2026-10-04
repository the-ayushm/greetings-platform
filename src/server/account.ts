import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { userDb } from "@/lib/supabase/server";
import { log } from "./log";
import { purgeSiteContent, siteUrl } from "./sites";

/** Everything we hold about the signed-in customer, as JSON (read through RLS). */
export async function exportAccount(userId: string) {
  const db = await userDb();
  const [{ data: profile }, { data: orders }, { data: sites }, { data: assets }] = await Promise.all([
    db.from("profiles").select("email, full_name, created_at").eq("id", userId).single(),
    db.from("orders").select("id, status, amount_paise, currency, created_at, paid_at, refunded_at").order("created_at"),
    db.from("sites").select("id, status, slug, created_at, updated_at, edit_until, expires_at, view_count, first_viewed_at, draft_content, published_version_id"),
    db.from("assets").select("id, site_id, kind, original_name, created_at, width, height, duration_s"),
  ]);
  const versions = new Map<string, unknown>();
  for (const s of sites ?? []) {
    if (!s.published_version_id) continue;
    const { data: v } = await db.from("site_versions").select("content").eq("id", s.published_version_id).maybeSingle();
    versions.set(s.id, v?.content ?? null);
  }
  return {
    exportedAt: new Date().toISOString(),
    profile,
    orders: orders ?? [],
    sites: (sites ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      edit_until: s.edit_until,
      expires_at: s.expires_at,
      view_count: s.view_count,
      first_viewed_at: s.first_viewed_at,
      draft_content: s.draft_content,
      url: s.slug && s.status === "published" ? siteUrl(s.slug) : null,
      publishedContent: versions.get(s.id) ?? null,
    })),
    files: assets ?? [],
    note: "Photo and song files can be downloaded from the editor while your site is active.",
  };
}

/**
 * Right to erasure: purge every site's content and files, then delete the auth user (the profile
 * cascades). Orders keep amounts/dates for accounting with the owner link removed.
 */
export async function deleteAccount(userId: string) {
  const db = adminDb();
  const { data: sites } = await db.from("sites").select("id").eq("user_id", userId);
  for (const s of sites ?? []) await purgeSiteContent(s.id);
  await db.from("sites").update({ status: "deleted", slug: null, passcode_hash: null, draft_content: {}, deleted_at: new Date().toISOString() }).eq("user_id", userId);
  await db.from("audit_log").insert({ actor_role: "system", action: "account.deleted", target_type: "user", target_id: userId });
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) {
    log.error("account.delete_failed", error);
    throw error;
  }
  return { deleted: true };
}
