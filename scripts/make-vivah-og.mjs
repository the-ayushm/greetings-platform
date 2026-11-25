/**
 * Renders the generic link-preview image for Shiv–Parvati invitations (public/og/vivah.png):
 * the template's own sky, Shiv's hand and Parvati's foot, and "You're invited". Generic on
 * purpose: link previews never show the couple's names, date or photos.
 * Run: node scripts/make-vivah-og.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;
const A = "public/vivah-assets/illus";

const sky = await sharp(`${A}/shiv-sky.jpg`).resize(W, H, { fit: "cover" }).toBuffer();
const hand = await sharp(`${A}/shiv-hand.webp`).resize({ width: 1000 }).png().toBuffer();
const stepFull = await sharp(`${A}/shiv-parvati-step.webp`).resize({ width: 560 }).png().toBuffer();
const stepMeta = await sharp(stepFull).metadata();
// Parts that would fall outside the canvas are cropped off first (sharp can't overflow).
const step = await sharp(stepFull).extract({ left: 0, top: 170, width: 520, height: Math.min(H, stepMeta.height - 170) }).toBuffer();
const handMeta = await sharp(hand).metadata();
const handVisible = Math.round(handMeta.height * 0.62);
const handCrop = await sharp(hand).extract({ left: 60, top: 0, width: handMeta.width - 60, height: handVisible }).toBuffer();

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><radialGradient id="g" cx=".4" cy=".36" r=".42"><stop offset="0" stop-color="#fff8fa" stop-opacity=".85"/><stop offset="1" stop-color="#fff8fa" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="470" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" letter-spacing="9" fill="#741225">WEDDING INVITATION</text>
  <text x="470" y="250" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="92" fill="#9a1d45">You're invited</text>
  <text x="470" y="312" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="32" fill="#55303b">Written by destiny, blessed by Mahadev</text>
</svg>`);

fs.mkdirSync("public/og", { recursive: true });
await sharp(sky)
  .composite([
    { input: step, left: W - 520, top: 0 },
    { input: handCrop, left: 0, top: H - handVisible },
    { input: text, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile("public/og/vivah.png");
console.log("wrote public/og/vivah.png");
