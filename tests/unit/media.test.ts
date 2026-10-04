import fs from "node:fs";
import { parseBuffer } from "music-metadata";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processAudio, sniffAudio } from "@/server/audio";
import { MediaRejected, processImage, sniffImage } from "@/server/images";

const fx = (f: string) => fs.readFileSync(`tests/fixtures/${f}`);

describe("images", () => {
  it("identifies by bytes, not extension", () => {
    expect(sniffImage(fx("photo-gps.jpg"))).toBe("jpeg");
    expect(sniffImage(fx("photo.png"))).toBe("png");
    expect(sniffImage(fx("photo.webp"))).toBe("webp");
    expect(sniffImage(fx("fake.heic"))).toBe("heic");
    expect(sniffImage(fx("not-an-image.jpg"))).toBe("unknown");
    expect(sniffImage(fx("evil.svg"))).toBe("unknown");
  });

  it("strips ALL metadata including GPS and produces two WebP sizes", async () => {
    const input = fx("photo-gps.jpg");
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const r = await processImage(input);
    expect(Object.keys(r.variants).sort()).toEqual(["w1200", "w480"]);
    for (const buf of Object.values(r.variants)) {
      const m = await sharp(buf).metadata();
      expect(m.format).toBe("webp");
      expect(m.exif).toBeUndefined();
      expect(m.xmp).toBeUndefined();
      expect(m.iptc).toBeUndefined();
      expect(buf.includes(Buffer.from("TestPhone"))).toBe(false);
    }
    const big = await sharp(r.variants.w1200!).metadata();
    expect(Math.max(big.width!, big.height!)).toBe(1200);
  });

  it.each([
    ["not-an-image.jpg", /isn't a JPEG/],
    ["evil.svg", /isn't a JPEG/],
    ["fake.heic", /HEIC/],
    ["bomb.png", /couldn't be read|too large/],
  ])("rejects %s", async (f, msg) => {
    await expect(processImage(fx(f))).rejects.toThrow(msg);
    await expect(processImage(fx(f))).rejects.toBeInstanceOf(MediaRejected);
  });
});

describe("audio", () => {
  it("identifies containers by bytes", () => {
    expect(sniffAudio(fx("song.mp3"))).toBe("mp3");
    expect(sniffAudio(fx("song.m4a"))).toBe("m4a");
    expect(sniffAudio(fx("song.aac"))).toBe("aac");
    expect(sniffAudio(fx("song.wav"))).toBe("unknown");
    expect(sniffAudio(fx("fake.mp3"))).toBe("unknown");
  });

  it("accepts MP3 and strips ID3 tags and embedded cover art", async () => {
    const before = await parseBuffer(fx("song.mp3"), "audio/mpeg");
    expect(before.common.title).toBe("Secret Title");
    expect(before.common.picture?.length).toBeGreaterThan(0);
    const r = await processAudio(fx("song.mp3"));
    expect(r.mime).toBe("audio/mpeg");
    expect(r.duration).toBeGreaterThan(5);
    const after = await parseBuffer(r.buffer, "audio/mpeg");
    expect(after.common.title).toBeUndefined();
    expect(after.common.artist).toBeUndefined();
    expect(after.common.picture).toBeUndefined();
    expect(r.buffer.includes(Buffer.from("Private Artist"))).toBe(false);
  });

  it("accepts M4A and neutralises its metadata boxes (still playable/parseable)", async () => {
    const r = await processAudio(fx("song.m4a"));
    expect(r.mime).toBe("audio/mp4");
    expect(r.buffer.length).toBe(fx("song.m4a").length);
    const after = await parseBuffer(r.buffer, "audio/mp4");
    expect(after.format.duration).toBeGreaterThan(5);
    expect(after.common.title).toBeUndefined();
    expect(r.buffer.includes(Buffer.from("Secret Title"))).toBe(false);
  });

  it("accepts raw AAC (ADTS)", async () => {
    const r = await processAudio(fx("song.aac"));
    expect(r.mime).toBe("audio/aac");
  });

  it.each([
    ["long-9min.mp3", /8 minutes/],
    ["song.wav", /isn't an MP3/],
    ["fake.mp3", /isn't an MP3/],
  ])("rejects %s", async (f, msg) => {
    await expect(processAudio(fx(f))).rejects.toThrow(msg);
  });
});
