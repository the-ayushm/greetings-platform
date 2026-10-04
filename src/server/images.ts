import "server-only";
import sharp, { type Metadata } from "sharp";

export class MediaRejected extends Error {}

export type ImageKind = "jpeg" | "png" | "webp";

/** Identify an image by its bytes, never by filename or declared type. */
export function sniffImage(b: Buffer): ImageKind | "heic" | "unknown" {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" && /^(heic|heix|hevc|hevx|mif1|msf1|avif)$/.test(b.toString("ascii", 8, 12))) return "heic";
  return "unknown";
}

const MAX_INPUT_PIXELS = 40_000_000; // ~ 7700×5200; stops decompression bombs
export const IMAGE_WIDTHS = [480, 1200] as const;

/**
 * Decode → auto-orient → resize to two WebP variants. sharp writes no metadata unless asked,
 * so EXIF (including GPS location), XMP, IPTC and comments are all dropped.
 */
export async function processImage(buf: Buffer) {
  const kind = sniffImage(buf);
  if (kind === "heic") throw new MediaRejected("HEIC photos need converting first — please try uploading again from the editor.");
  if (kind === "unknown") throw new MediaRejected("That file isn't a JPEG, PNG or WebP photo.");

  let meta: Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" }).metadata();
  } catch {
    throw new MediaRejected("That photo couldn't be read. It may be damaged or too large.");
  }
  if (!meta.width || !meta.height) throw new MediaRejected("That photo couldn't be read.");
  if ((meta.pages ?? 1) > 1) throw new MediaRejected("Animated images aren't supported. Please choose a still photo.");

  const variants: Record<string, Buffer> = {};
  let out = { width: 0, height: 0 };
  for (const w of IMAGE_WIDTHS) {
    const { data, info } = await sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
      .rotate()
      .resize({ width: w, height: w, fit: "inside", withoutEnlargement: true })
      .webp({ quality: w === 480 ? 74 : 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    variants[`w${w}`] = data;
    if (w === 1200) out = { width: info.width, height: info.height };
  }
  return { variants, ...out, sourceKind: kind };
}
