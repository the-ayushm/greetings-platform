import "server-only";
import crypto from "node:crypto";
import { adminDb } from "@/lib/supabase/admin";
import { publishContentSchema, referencedAssets } from "@/templates/scrapbook/schema";
import { AUDIO_MAX_BYTES, processAudio } from "./audio";
import { ApiError, badRequest, conflict, notFound } from "./http";
import { MediaRejected, processImage } from "./images";
import { log } from "./log";
import { isTransient, storageBusy, storageCall } from "./retry";
import { getOwnedSite, MEDIA_BUCKET, removePrefix, SIGNED_URL_TTL } from "./sites";

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/aac", "audio/x-aac"];
const MAX_LIVE = { image: 40, audio: 3 } as const;

/** Display-only name: no path, no control/bidi characters, bounded. Never used in storage paths. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  return (
    base
      .normalize("NFC")
      .replace(/[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩<>:"|?*]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "file"
  );
}

export async function createUpload(
  userId: string,
  siteId: string,
  input: { kind: "image" | "audio"; mime: string; bytes: number; filename: string; rightsConfirmed?: boolean },
) {
  const site = await getOwnedSite(userId, siteId);
  if (!["draft", "published", "unpublished"].includes(site.status) || new Date(site.edit_until) < new Date()) {
    throw new ApiError(423, "locked", "This site can't be edited anymore.");
  }
  const mime = input.mime.toLowerCase();
  if (input.kind === "image") {
    if (mime === "image/heic" || mime === "image/heif") throw badRequest("HEIC photos are converted in your browser first. Please try again from the editor.");
    if (!IMAGE_TYPES.includes(mime)) throw badRequest("Photos must be JPEG, PNG or WebP.");
    if (input.bytes > IMAGE_MAX_BYTES) throw badRequest("Photos can be up to 15 MB.");
  } else {
    if (!AUDIO_TYPES.includes(mime)) throw badRequest("Songs must be MP3, M4A or AAC.");
    if (input.bytes > AUDIO_MAX_BYTES) throw badRequest("Songs can be up to 12 MB.");
    if (!input.rightsConfirmed) throw badRequest("Please confirm you have the right to use this song.");
  }
  const { count } = await adminDb().from("assets").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("kind", input.kind).in("status", ["pending", "ready"]);
  if ((count ?? 0) >= MAX_LIVE[input.kind]) throw conflict("quota", input.kind === "image" ? "You've reached the photo limit for this site. Delete unused photos first." : "Delete an old song first.");

  const id = crypto.randomUUID();
  const { error } = await adminDb()
    .from("assets")
    .insert({
      id,
      site_id: siteId,
      user_id: userId,
      kind: input.kind,
      declared_mime: mime,
      declared_bytes: input.bytes,
      original_name: sanitizeFilename(input.filename),
      storage_prefix: id,
      rights_confirmed_at: input.kind === "audio" ? new Date().toISOString() : null,
    });
  if (error) throw error;
  const { data: signed, error: signErr } = await storageCall("sign-upload", () => adminDb().storage.from(MEDIA_BUCKET).createSignedUploadUrl(`${id}/upload`));
  if (signErr || !signed) {
    await adminDb().from("assets").delete().eq("id", id);
    if (isTransient(signErr)) throw storageBusy();
    throw signErr ?? new Error("signed upload failed");
  }
  return { assetId: id, path: signed.path, token: signed.token };
}

async function ownedAsset(userId: string, assetId: string) {
  const { data } = await adminDb().from("assets").select("*").eq("id", assetId).eq("user_id", userId).neq("status", "deleted").maybeSingle();
  if (!data) throw notFound();
  return data;
}

export async function completeUpload(userId: string, assetId: string) {
  const asset = await ownedAsset(userId, assetId);
  await getOwnedSite(userId, asset.site_id);
  if (asset.status === "ready") return publicAsset(asset);
  if (asset.status !== "pending") throw conflict("not_pending", "This upload was already processed.");

  const store = adminDb().storage.from(MEDIA_BUCKET);
  const uploadPath = `${asset.storage_prefix}/upload`;
  const { data: blob, error } = await storageCall("download-upload", () => store.download(uploadPath));
  if (error && isTransient(error)) throw storageBusy(); // asset stays pending: completing again retries
  if (error || !blob) throw badRequest("The upload didn't arrive. Please try again.");
  const buf = Buffer.from(await blob.arrayBuffer());

  try {
    const limit = asset.kind === "image" ? IMAGE_MAX_BYTES : AUDIO_MAX_BYTES;
    if (buf.length > limit) throw new MediaRejected(asset.kind === "image" ? "Photos can be up to 15 MB." : "Songs can be up to 12 MB.");
    const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
    let update: Record<string, unknown>;
    if (asset.kind === "image") {
      const img = await processImage(buf);
      const variants: Record<string, string> = {};
      for (const [name, data] of Object.entries(img.variants)) {
        const path = `${asset.storage_prefix}/${name}.webp`;
        const up = await storageCall("upload-variant", () => store.upload(path, data, { contentType: "image/webp", upsert: true, cacheControl: "31536000" }));
        if (up.error) throw up.error;
        variants[name] = path;
      }
      update = { status: "ready", mime: "image/webp", bytes: buf.length, width: img.width, height: img.height, variants, sha256 };
    } else {
      const a = await processAudio(buf);
      const path = `${asset.storage_prefix}/audio.${a.ext}`;
      const up = await storageCall("upload-audio", () => store.upload(path, a.buffer, { contentType: a.mime, upsert: true, cacheControl: "31536000" }));
      if (up.error) throw up.error;
      update = { status: "ready", mime: a.mime, bytes: a.buffer.length, duration_s: a.duration, variants: { audio: path }, sha256 };
    }
    await store.remove([uploadPath]);
    const { data: updated } = await adminDb().from("assets").update(update as never).eq("id", asset.id).select("*").single();
    return publicAsset(updated!);
  } catch (e) {
    if (!(e instanceof MediaRejected) && isTransient(e)) throw storageBusy(); // still pending; retry completes it
    await store.remove([uploadPath]);
    const reason = e instanceof MediaRejected ? e.message : "That file couldn't be processed.";
    await adminDb().from("assets").update({ status: "rejected", rejection_reason: reason }).eq("id", asset.id);
    if (!(e instanceof MediaRejected)) log.error("media.process_failed", e, { asset: asset.id, kind: asset.kind });
    throw badRequest(reason);
  }
}

export async function deleteAsset(userId: string, assetId: string) {
  const asset = await ownedAsset(userId, assetId);
  const site = await getOwnedSite(userId, asset.site_id);
  if (site.published_version_id) {
    const { data: v } = await adminDb().from("site_versions").select("content").eq("id", site.published_version_id).single();
    const parsed = publishContentSchema.safeParse(v?.content);
    if (parsed.success && referencedAssets(parsed.data).some((r) => r.id === assetId)) {
      throw conflict("in_use", "This file is on your published page. Remove it and publish again before deleting it.");
    }
  }
  await removePrefix(asset.storage_prefix);
  await adminDb().from("assets").update({ status: "deleted", variants: {} }).eq("id", asset.id);
  return { deleted: true };
}

type AssetRow = { id: string; kind: string; status: string; original_name: string; width: number | null; height: number | null; duration_s: number | null; created_at: string };
export function publicAsset(a: AssetRow) {
  return { id: a.id, kind: a.kind, status: a.status, name: a.original_name, width: a.width, height: a.height, duration: a.duration_s, createdAt: a.created_at };
}

/** Owner's asset library for the editor, with short-lived preview URLs. */
export async function listSiteAssets(userId: string, siteId: string) {
  await getOwnedSite(userId, siteId);
  const { data } = await adminDb().from("assets").select("*").eq("site_id", siteId).eq("status", "ready").order("created_at", { ascending: false });
  const rows = data ?? [];
  const paths = rows.flatMap((a) => {
    const v = (a.variants ?? {}) as Record<string, string>;
    return [v.w480, v.w1200, v.audio].filter(Boolean) as string[];
  });
  const { data: signed } = paths.length ? await adminDb().storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL) : { data: [] };
  const url = new Map((signed ?? []).filter((s) => s.path && s.signedUrl).map((s) => [s.path!, s.signedUrl]));
  return rows.map((a) => {
    const v = (a.variants ?? {}) as Record<string, string>;
    return { ...publicAsset(a), thumb: v.w480 ? url.get(v.w480) ?? null : null, src: v.w1200 ? url.get(v.w1200) ?? null : v.audio ? url.get(v.audio) ?? null : null, srcSmall: v.w480 ? url.get(v.w480) ?? null : null };
  });
}
