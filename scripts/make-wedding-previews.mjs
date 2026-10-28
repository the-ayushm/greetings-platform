/**
 * Captures the product-page previews of the wedding invitation from the live demo:
 * public/products/wedding/{envelope,cover,schedule,rsvp}.webp (phone screenshots) and
 * public/products/wedding/og.jpg (the store page's share image).
 * Needs the app running. Run: node scripts/make-wedding-previews.mjs [http://app.localhost:3000]
 */
import fs from "node:fs";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.argv[2] ?? process.env.APP_ORIGIN ?? "http://app.localhost:3000";
const OUT = "public/products/wedding";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const page = await ctx.newPage();
const shots = {};

async function shot(name, at) {
  await page.goto(`${base}/demo/wedding${at ? `?at=${at}` : ""}`, { waitUntil: "load", timeout: 180_000 });
  await page.waitForSelector(".wd[data-hydrated]");
  await page.evaluate(() => document.fonts.ready);
  if (name === "cover") await page.getByTestId("wd-seal").click({ force: true });
  await page.waitForTimeout(900);
  shots[name] = await page.screenshot();
  await sharp(shots[name]).resize({ width: 600 }).webp({ quality: 82 }).toFile(`${OUT}/${name}.webp`);
}

await shot("envelope", null);
await shot("cover", null);
await shot("schedule", "schedule");
await shot("rsvp", "rsvp");
await browser.close();

// Share image for the product page: three phones on the burgundy backdrop.
const W = 1200;
const H = 630;
const phoneH = 540;
const phone = async (buf) => {
  const img = await sharp(buf).resize({ height: phoneH }).png().toBuffer();
  const { width } = await sharp(img).metadata();
  const r = 28;
  const mask = Buffer.from(`<svg width="${width}" height="${phoneH}"><rect width="${width}" height="${phoneH}" rx="${r}" ry="${r}"/></svg>`);
  return { buf: await sharp(img).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer(), width };
};
const phones = await Promise.all([phone(shots.envelope), phone(shots.cover), phone(shots.schedule)]);
const gap = 40;
const total = phones.reduce((n, p) => n + p.width, 0) + gap * (phones.length - 1);
let x = Math.round((W - total) / 2);
const layers = phones.map((p) => {
  const l = { input: p.buf, left: x, top: Math.round((H - phoneH) / 2) };
  x += p.width + gap;
  return l;
});
const bg = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#6a2033"/><stop offset="1" stop-color="#2a0c14"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
await sharp(bg).composite(layers).jpeg({ quality: 84 }).toFile(`${OUT}/og.jpg`);
console.log(`wrote ${OUT}/{envelope,cover,schedule,rsvp}.webp and og.jpg`);
