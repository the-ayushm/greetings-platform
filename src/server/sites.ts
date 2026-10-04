import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { userDb } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { publishContentSchema, referencedAssets, SCHEMA_VERSION, type ScrapbookContent } from "@/templates/scrapbook/schema";
import type { MediaMap } from "@/templates/scrapbook/Experience";
import { hashPasscode, newSlug } from "./crypto";
import { rendererOrigin } from "./env";
import { ApiError, badRequest, conflict, notFound } from "./http";
import { log } from "./log";

export const MEDIA_BUCKET = "media";
export const SIGNED_URL_TTL = 2 * 60 * 60;
const EDITABLE = ["draft", "published", "unpublished"] as const;

export type OwnedSite = Awaited<ReturnType<typeof getOwnedSite>>;

/**
 * Loads a site through the user's own RLS-scoped client: if RLS says it isn't theirs, it
 * doesn't exist. Every mutation below starts here, then writes with an explicit owner filter.
 */
export async function getOwnedSite(userId: string, siteId: string) {
  const db = await userDb();
  const { data } = await db.from("sites").select("*").eq("id", siteId).maybeSingle();
  if (!data || data.user_id !== userId || data.status === "deleted") throw notFound();
  return data;
}

export function siteUrl(slug: string) {
  return `${rendererOrigin()}/birthday/${slug}`;
}

function assertEditable(site: { status: string; edit_until: string; expires_at: string }) {
  if (!(EDITABLE as readonly string[]).includes(site.status)) throw new ApiError(423, "locked", `This site is ${site.status} and can't be edited.`);
  if (new Date(site.edit_until) < new Date()) throw new ApiError(423, "edit_window_closed", "The editing window for this site has ended.");
  if (new Date(site.expires_at) < new Date()) throw new ApiError(423, "expired", "This site has expired.");
}

/** Every referenced asset must belong to THIS site, be ready, and be the right kind. */
async function assertAssetsOwned(siteId: string, refs: { id: string; kind: "image" | "audio" }[], requireReady: boolean) {
  if (!refs.length) return;
  const ids = [...new Set(refs.map((r) => r.id))];
  const { data } = await adminDb().from("assets").select("id, kind, status").eq("site_id", siteId).in("id", ids);
  const found = new Map((data ?? []).map((a) => [a.id, a]));
  for (const r of refs) {
    const a = found.get(r.id);
    if (!a || a.status === "deleted" || a.status === "rejected" || a.kind !== r.kind || (requireReady && a.status !== "ready")) {
      throw badRequest("A photo or song in your content isn't available. Please re-upload it.", { assetId: r.id });
    }
  }
}

export async function saveDraft(userId: string, siteId: string, content: ScrapbookContent, baseRevision: number) {
  const site = await getOwnedSite(userId, siteId);
  assertEditable(site);
  await assertAssetsOwned(siteId, referencedAssets(content), false);
  const { data } = await adminDb()
    .from("sites")
    .update({ draft_content: content as unknown as { [key: string]: Json }, draft_revision: baseRevision + 1 })
    .eq("id", siteId)
    .eq("user_id", userId)
    .eq("draft_revision", baseRevision)
    .in("status", [...EDITABLE])
    .select("draft_revision")
    .maybeSingle();
  if (!data) {
    const fresh = await getOwnedSite(userId, siteId);
    throw conflict("revision_conflict", "This site was changed in another tab. Reload to get the latest version.", { revision: fresh.draft_revision });
  }
  return { revision: data.draft_revision };
}

export async function publishSite(userId: string, siteId: string) {
  const site = await getOwnedSite(userId, siteId);
  assertEditable(site);
  const parsed = publishContentSchema.safeParse(site.draft_content);
  if (!parsed.success) {
    throw badRequest("Some required fields are empty.", { issues: parsed.error.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), message: i.message })) });
  }
  await assertAssetsOwned(siteId, referencedAssets(parsed.data), true);
  const { data, error } = await adminDb().rpc("publish_site", {
    p_site_id: siteId,
    p_user_id: userId,
    p_content: parsed.data as unknown as { [key: string]: Json },
    p_schema_version: SCHEMA_VERSION,
    p_new_slug: newSlug(),
  });
  if (error) throw error;
  const r = data as { status: string; slug?: string; version?: number };
  if (r.status !== "published") throw new ApiError(423, r.status, "This site can't be published right now.");
  return { slug: r.slug!, url: siteUrl(r.slug!), version: r.version! };
}

async function audit(userId: string, action: string, siteId: string, meta: Record<string, unknown> = {}) {
  await adminDb().from("audit_log").insert({ actor_id: userId, actor_role: "customer", action, target_type: "site", target_id: siteId, meta: meta as { [key: string]: Json } });
}

export async function unpublishSite(userId: string, siteId: string) {
  const site = await getOwnedSite(userId, siteId);
  if (site.status !== "published") throw conflict("not_published", "This site isn't published.");
  await adminDb().from("sites").update({ status: "unpublished" }).eq("id", siteId).eq("user_id", userId).eq("status", "published");
  await audit(userId, "site.unpublished", siteId);
  return { status: "unpublished" };
}

/** New random link; the old one stops working immediately (and old passcode unlocks with it). */
export async function rotateLink(userId: string, siteId: string) {
  const site = await getOwnedSite(userId, siteId);
  if (!site.slug) throw conflict("no_link", "Publish the site first.");
  if (!(EDITABLE as readonly string[]).includes(site.status)) throw new ApiError(423, "locked", `This site is ${site.status}.`);
  const slug = newSlug();
  await adminDb().from("sites").update({ slug, passcode_version: site.passcode_version + 1 }).eq("id", siteId).eq("user_id", userId);
  await audit(userId, "site.link_rotated", siteId);
  return { slug, url: siteUrl(slug) };
}

export async function setPasscode(userId: string, siteId: string, code: string | null) {
  const site = await getOwnedSite(userId, siteId);
  if (!(EDITABLE as readonly string[]).includes(site.status)) throw new ApiError(423, "locked", `This site is ${site.status}.`);
  await adminDb()
    .from("sites")
    .update({ passcode_hash: code ? hashPasscode(code) : null, passcode_version: site.passcode_version + 1 })
    .eq("id", siteId)
    .eq("user_id", userId);
  await audit(userId, code ? "site.passcode_set" : "site.passcode_removed", siteId);
  return { passcode: Boolean(code) };
}

/** Deleting removes all personal content and files right away; the order record stays. */
export async function deleteSite(userId: string, siteId: string) {
  await getOwnedSite(userId, siteId);
  await purgeSiteContent(siteId);
  await adminDb()
    .from("sites")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), slug: null, passcode_hash: null, draft_content: {}, published_version_id: null })
    .eq("id", siteId)
    .eq("user_id", userId);
  await audit(userId, "site.deleted", siteId);
  return { deleted: true };
}

/** Removes storage objects, asset rows and published snapshots for a site. */
export async function purgeSiteContent(siteId: string) {
  const db = adminDb();
  const { data: assets } = await db.from("assets").select("id, storage_prefix").eq("site_id", siteId);
  for (const a of assets ?? []) await removePrefix(a.storage_prefix);
  await db.from("sites").update({ published_version_id: null }).eq("id", siteId);
  await db.from("site_versions").delete().eq("site_id", siteId);
  await db.from("assets").delete().eq("site_id", siteId);
}

export async function removePrefix(prefix: string) {
  const store = adminDb().storage.from(MEDIA_BUCKET);
  const { data: files } = await store.list(prefix, { limit: 100 });
  const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
  if (paths.length) {
    const { error } = await store.remove(paths);
    if (error) log.error("storage.remove_failed", error, { prefix });
  }
}

// ───────────────────────── public renderer ─────────────────────────

export type PublicSite = { id: string; slug: string; passcodeHash: string | null; passcodeVersion: number; content: ScrapbookContent };

/**
 * Server-only lookup by slug (service role). Only published, unexpired sites resolve; every
 * other state is indistinguishable from "never existed".
 */
export async function resolvePublicSite(slug: string): Promise<PublicSite | null> {
  if (!/^[A-Za-z0-9]{22}$/.test(slug)) return null;
  const db = adminDb();
  const { data: site } = await db
    .from("sites")
    .select("id, slug, status, expires_at, passcode_hash, passcode_version, published_version_id")
    .eq("slug", slug)
    .eq("status", "published")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!site?.published_version_id) return null;
  const { data: version } = await db.from("site_versions").select("content").eq("id", site.published_version_id).eq("site_id", site.id).maybeSingle();
  if (!version) return null;
  const parsed = publishContentSchema.safeParse(version.content);
  if (!parsed.success) {
    log.error("site.invalid_published_content", null, { site: site.id });
    return null;
  }
  return { id: site.id, slug: site.slug!, passcodeHash: site.passcode_hash, passcodeVersion: site.passcode_version, content: parsed.data };
}

/** Short-lived signed URLs for exactly the assets this content references (same site only). */
export async function signMedia(siteId: string, content: ScrapbookContent): Promise<MediaMap> {
  const refs = referencedAssets(content);
  const out: MediaMap = { images: {}, audio: {} };
  if (!refs.length) return out;
  const db = adminDb();
  const { data: assets } = await db
    .from("assets")
    .select("id, kind, variants")
    .eq("site_id", siteId)
    .eq("status", "ready")
    .in("id", [...new Set(refs.map((r) => r.id))]);
  const paths: string[] = [];
  for (const a of assets ?? []) for (const p of Object.values((a.variants ?? {}) as Record<string, string>)) paths.push(p);
  if (!paths.length) return out;
  const { data: signed } = await db.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  const url = new Map((signed ?? []).filter((s) => s.signedUrl && s.path).map((s) => [s.path!, s.signedUrl]));
  for (const a of assets ?? []) {
    const v = (a.variants ?? {}) as Record<string, string>;
    if (a.kind === "image" && v.w1200 && url.get(v.w1200)) {
      const small = v.w480 ? url.get(v.w480) : null;
      out.images[a.id] = { src: url.get(v.w1200)!, srcSet: small ? `${small} 480w, ${url.get(v.w1200)} 1200w` : undefined };
    }
    if (a.kind === "audio" && v.audio && url.get(v.audio)) out.audio[a.id] = { src: url.get(v.audio)! };
  }
  return out;
}

export async function recordView(siteId: string) {
  await adminDb().rpc("record_view", { p_site_id: siteId });
}
