"use client";

import { api } from "@/lib/api-client";
import { browserDb } from "@/lib/supabase/browser";

export type LibraryAsset = { id: string; kind: "image" | "audio"; name: string; thumb: string | null; src: string | null; srcSmall: string | null; duration: number | null };

const MAX_IMAGE_SIDE = 2400;
export const AUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const AUDIO_MAX_SECONDS = 8 * 60;

async function looksHeic(file: File) {
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) return true;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ftyp = String.fromCharCode(...head.slice(4, 8));
  const brand = String.fromCharCode(...head.slice(8, 12));
  return ftyp === "ftyp" && /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(brand);
}

/**
 * Prepare a photo in the browser: HEIC → JPEG (iPhone default format), then shrink very large
 * photos so uploads are quick on mobile data. The server re-validates and re-encodes regardless.
 */
export async function preparePhoto(file: File): Promise<{ blob: Blob; type: string; name: string }> {
  let blob: Blob = file;
  let type = file.type;
  if (await looksHeic(file)) {
    const { heicTo } = await import("heic-to/csp");
    blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
    type = "image/jpeg";
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) throw new Error("Please choose a JPEG, PNG, WebP or HEIC photo.");
  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
    if (scale < 1 || blob.size > 6 * 1024 * 1024) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
      if (out) {
        blob = out;
        type = "image/jpeg";
      }
    }
    bmp.close();
  } catch {
    // Unreadable in this browser: send as-is and let the server decide.
  }
  return { blob, type, name: file.name.replace(/\.(heic|heif)$/i, ".jpg") };
}

export function audioType(file: File): string {
  if (file.type) return file.type === "audio/mp3" ? "audio/mpeg" : file.type;
  if (/\.mp3$/i.test(file.name)) return "audio/mpeg";
  if (/\.m4a$/i.test(file.name)) return "audio/mp4";
  if (/\.aac$/i.test(file.name)) return "audio/aac";
  return "application/octet-stream";
}

/** Best-effort duration check before uploading (the server enforces the real limit). */
export function audioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(file);
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(isFinite(a.duration) ? a.duration : null);
    a.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    a.src = url;
  });
}

/** create → upload straight to private storage with a single-use signed URL → server processing */
export async function uploadAsset(siteId: string, kind: "image" | "audio", blob: Blob, type: string, name: string, rightsConfirmed = false) {
  const created = await api<{ assetId: string; path: string; token: string }>(`/api/sites/${siteId}/assets`, {
    method: "POST",
    body: { kind, mime: type, bytes: blob.size, filename: name, rightsConfirmed },
  });
  const { error } = await browserDb().storage.from("media").uploadToSignedUrl(created.path, created.token, blob, { contentType: type });
  if (error) throw new Error("The upload was interrupted. Please try again.");
  await api(`/api/assets/${created.assetId}/complete`, { method: "POST" });
  return created.assetId;
}
