import "server-only";
import { parseBuffer } from "music-metadata";
import { MediaRejected } from "./images";

export const AUDIO_MAX_SECONDS = 8 * 60;
export const AUDIO_MAX_BYTES = 12 * 1024 * 1024;

export type AudioKind = "mp3" | "m4a" | "aac";

const MIME: Record<AudioKind, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac" };

function id3v2Size(b: Buffer, at: number): number {
  // "ID3" + ver(2) + flags(1) + syncsafe size(4); +10 header, +10 footer if flag 0x10.
  const size = ((b[at + 6]! & 0x7f) << 21) | ((b[at + 7]! & 0x7f) << 14) | ((b[at + 8]! & 0x7f) << 7) | (b[at + 9]! & 0x7f);
  return 10 + size + (b[at + 5]! & 0x10 ? 10 : 0);
}

function skipId3(b: Buffer): number {
  let at = 0;
  while (b.length >= at + 10 && b.toString("latin1", at, at + 3) === "ID3") at += id3v2Size(b, at);
  return at;
}

/** Identify by bytes: MP3 frame sync, ADTS AAC sync, or an ISO-BMFF "ftyp" audio brand. */
export function sniffAudio(b: Buffer): AudioKind | "unknown" {
  if (b.length >= 12 && b.toString("latin1", 4, 8) === "ftyp") {
    const brand = b.toString("latin1", 8, 12);
    return /^(M4A |M4B |mp42|mp41|isom|iso2|dash)$/.test(brand) ? "m4a" : "unknown";
  }
  const at = skipId3(b);
  if (b.length < at + 2) return "unknown";
  const h0 = b[at]!,
    h1 = b[at + 1]!;
  if (h0 === 0xff && (h1 & 0xf6) === 0xf0) return "aac"; // ADTS: 1111 1111 1111 x00x
  if (h0 === 0xff && (h1 & 0xe0) === 0xe0 && (h1 & 0x06) !== 0) return "mp3"; // MPEG audio frame, layer ≠ reserved
  return "unknown";
}

/** Drop ID3v2 (start) and ID3v1 (last 128 bytes) tags: titles, comments, embedded pictures. */
function stripId3(b: Buffer): Buffer {
  let out = b.subarray(skipId3(b));
  if (out.length >= 128 && out.toString("latin1", out.length - 128, out.length - 125) === "TAG") out = out.subarray(0, out.length - 128);
  return Buffer.from(out);
}

/**
 * MP4/M4A: turn every metadata box ("udta", "meta") under moov/trak into a same-sized "free"
 * box with zeroed payload. Sizes and chunk offsets stay valid, the tags/artwork are gone.
 */
function stripMp4(b: Buffer): Buffer {
  const out = Buffer.from(b);
  const CONTAINERS = new Set(["moov", "trak", "mdia", "minf"]);
  const walk = (start: number, end: number, depth: number) => {
    let at = start;
    while (at + 8 <= end) {
      let size = out.readUInt32BE(at);
      const type = out.toString("latin1", at + 4, at + 8);
      let header = 8;
      if (size === 1) {
        if (at + 16 > end) return;
        size = Number(out.readBigUInt64BE(at + 8));
        header = 16;
      } else if (size === 0) size = end - at;
      if (size < header || at + size > end) return;
      if (depth > 0 && (type === "udta" || type === "meta")) {
        out.write("free", at + 4, "latin1");
        out.fill(0, at + header, at + size);
      } else if (CONTAINERS.has(type) && depth < 6) walk(at + header, at + size, depth + 1);
      at += size;
    }
  };
  walk(0, out.length, 0);
  return out;
}

export async function processAudio(buf: Buffer) {
  if (buf.length > AUDIO_MAX_BYTES) throw new MediaRejected("Songs can be up to 12 MB.");
  const kind = sniffAudio(buf);
  if (kind === "unknown") throw new MediaRejected("That file isn't an MP3, M4A or AAC song.");

  const clean = kind === "m4a" ? stripMp4(buf) : stripId3(buf);
  let format;
  try {
    ({ format } = await parseBuffer(clean, { mimeType: MIME[kind], size: clean.length }, { duration: true, skipCovers: true }));
  } catch {
    throw new MediaRejected("That song couldn't be read. It may be damaged.");
  }
  const codec = (format.codec ?? "").toLowerCase();
  const okCodec = kind === "mp3" ? /mpeg|layer 3|mp3/.test(codec) : /aac|mp4a/.test(codec);
  if (!okCodec) throw new MediaRejected("That song uses an unsupported format. Please use MP3, M4A or AAC.");
  const duration = format.duration ?? 0;
  if (!(duration > 0)) throw new MediaRejected("That song couldn't be read. It may be damaged.");
  if (duration > AUDIO_MAX_SECONDS + 1) throw new MediaRejected("Songs can be up to 8 minutes long.");
  return { buffer: clean, kind, mime: MIME[kind], ext: kind, duration: Math.round(duration * 100) / 100 };
}

export const _test = { stripMp4, stripId3, skipId3 };
