import fs from "node:fs";
import { parseBuffer } from "music-metadata";
import { expect, test, type Page } from "@playwright/test";
import { admin } from "../helpers/db";
import { api, buySite, newCustomer, uploadFile } from "./helpers";

test.describe.configure({ mode: "serial", timeout: 180_000 });

const fx = (f: string) => fs.readFileSync(`tests/fixtures/${f}`);
let page: Page;
let siteId: string;

test.beforeAll(async ({ browser }) => {
  ({ page } = await newCustomer(browser, "upl"));
  siteId = await buySite(page);
});

test("valid photos (JPEG/PNG/WebP) are accepted and stored only as metadata-free WebP variants", async () => {
  for (const [f, mime] of [["photo-gps.jpg", "image/jpeg"], ["photo.png", "image/png"], ["photo.webp", "image/webp"]] as const) {
    const r = await uploadFile(page, siteId, "image", fx(f), mime, f);
    expect(r.status, JSON.stringify(r.json)).toBe(200);
    const { data: a } = await admin().from("assets").select("status, mime, variants, storage_prefix").eq("id", r.assetId!).single();
    expect(a!.status).toBe("ready");
    const objects = (await admin().storage.from("media").list(a!.storage_prefix)).data!.map((o) => o.name).sort();
    expect(objects).toEqual(["w1200.webp", "w480.webp"]); // original upload removed
  }
});

for (const [name, f, mime, msg] of [
  ["renamed executable", "not-an-image.jpg", "image/jpeg", /isn't a JPEG/],
  ["SVG with script, declared as PNG", "evil.svg", "image/png", /isn't a JPEG/],
  ["fake HEIC sent without conversion", "fake.heic", "image/jpeg", /HEIC/],
  ["decompression bomb (50 megapixels)", "bomb.png", "image/png", /couldn't be read|too large/],
] as const) test(`rejects ${name} and deletes the upload`, async () => {
  const r = await uploadFile(page, siteId, "image", fx(f), mime, f);
  expect(r.stage).toBe("complete");
  expect(r.status).toBe(400);
  expect(JSON.stringify(r.json)).toMatch(msg);
  const { data: a } = await admin().from("assets").select("status, storage_prefix").eq("id", r.assetId!).single();
  expect(a!.status).toBe("rejected");
  expect((await admin().storage.from("media").list(a!.storage_prefix)).data).toEqual([]);
});

test("refuses disallowed types and oversize declarations before any upload URL is issued", async () => {
  const x = api(page);
  for (const body of [
    { kind: "image", mime: "image/svg+xml", bytes: 100, filename: "a.svg" },
    { kind: "image", mime: "image/heic", bytes: 100, filename: "a.heic" },
    { kind: "image", mime: "text/html", bytes: 100, filename: "a.html" },
    { kind: "image", mime: "image/jpeg", bytes: 16 * 1024 * 1024, filename: "big.jpg" },
    { kind: "audio", mime: "audio/wav", bytes: 100, filename: "a.wav", rightsConfirmed: true },
    { kind: "audio", mime: "audio/mpeg", bytes: 13 * 1024 * 1024, filename: "big.mp3", rightsConfirmed: true },
    { kind: "audio", mime: "audio/mpeg", bytes: 1000, filename: "no-rights.mp3", rightsConfirmed: false },
    { kind: "video", mime: "video/mp4", bytes: 100, filename: "a.mp4" },
  ]) {
    const r = await x.post(`/api/sites/${siteId}/assets`, body);
    expect(r.status, JSON.stringify(body)).toBe(400);
  }
});

test("storage itself refuses files bigger than the bucket limit, even with a valid upload URL", async () => {
  const big = Buffer.alloc(16 * 1024 * 1024, 0xff);
  // Ask for an URL declaring a small file, then try to push 16 MB through it.
  const created = await api(page).post(`/api/sites/${siteId}/assets`, { kind: "image", mime: "image/jpeg", bytes: 1000, filename: "liar.jpg" });
  const { path, token } = created.json as { path: string; token: string };
  const up = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/media/${path}?token=${token}`, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: big });
  expect(up.ok).toBe(false);
});

test("malicious filenames are neutralised (display only, never part of a storage path)", async () => {
  const r = await uploadFile(page, siteId, "image", fx("photo.png"), "image/png", '../../../etc/<img src=x onerror=alert(1)>‮gnp.exe');
  expect(r.status).toBe(200);
  const { data: a } = await admin().from("assets").select("original_name, storage_prefix").eq("id", r.assetId!).single();
  expect(a!.original_name).not.toMatch(/[<>/\\‮]/);
  expect(a!.storage_prefix).toBe(r.assetId);
});

test("songs: MP3, M4A and AAC accepted with tags stripped; long/wrong files rejected", async () => {
  for (const [f, mime] of [["song.mp3", "audio/mpeg"], ["song.m4a", "audio/x-m4a"], ["song.aac", "audio/aac"]] as const) {
    const r = await uploadFile(page, siteId, "audio", fx(f), mime, f);
    expect(r.status, `${f} ${JSON.stringify(r.json)}`).toBe(200);
    const { data: a } = await admin().from("assets").select("variants, duration_s, rights_confirmed_at").eq("id", r.assetId!).single();
    expect(Number(a!.duration_s)).toBeGreaterThan(5);
    expect(a!.rights_confirmed_at).not.toBeNull();
    const path = (a!.variants as { audio: string }).audio;
    const { data: blob } = await admin().storage.from("media").download(path);
    const buf = Buffer.from(await blob!.arrayBuffer());
    expect(buf.includes(Buffer.from("Private Artist"))).toBe(false);
    const meta = await parseBuffer(buf);
    expect(meta.common.title).toBeUndefined();
    // Keep under the per-site song limit for the next files.
    await api(page).del(`/api/assets/${r.assetId}`);
  }
  for (const [f, mime, msg] of [["long-9min.mp3", "audio/mpeg", /8 minutes/], ["fake.mp3", "audio/mpeg", /isn't an MP3/]] as const) {
    const r = await uploadFile(page, siteId, "audio", fx(f), mime, f);
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.json)).toMatch(msg);
  }
});

test("an upload can only be completed by its owner, and only once", async ({ browser }) => {
  const created = await api(page).post(`/api/sites/${siteId}/assets`, { kind: "image", mime: "image/png", bytes: fx("photo.png").length, filename: "p.png" });
  const { path, token, assetId } = created.json as { path: string; token: string; assetId: string };
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/media/${path}?token=${token}`, { method: "PUT", headers: { "content-type": "image/png" }, body: new Uint8Array(fx("photo.png")) });
  // The signed upload token is single-use.
  const reuse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/upload/sign/media/${path}?token=${token}`, { method: "PUT", headers: { "content-type": "image/png" }, body: new Uint8Array(fx("photo.png")) });
  expect(reuse.ok).toBe(false);
  const other = await newCustomer(browser, "upl-other");
  expect((await api(other.page).post(`/api/assets/${assetId}/complete`)).status).toBe(404);
  expect((await api(page).post(`/api/assets/${assetId}/complete`)).status).toBe(200);
  await other.context.close();
});
