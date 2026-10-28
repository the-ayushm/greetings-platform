/**
 * Renders the generic link-preview image for love story pages (public/og/love-story.png).
 * Generic on purpose: link previews never show the couple's names or photos.
 * Run: node scripts/make-og.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;
const heart = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const stars = Array.from({ length: 70 }, () => `<circle cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * H * 0.55).toFixed(1)}" r="${(0.6 + rnd() * 1.6).toFixed(2)}" fill="#fff" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`).join("");
const bulbs = Array.from({ length: 22 }, (_, i) => {
  const x = ((i + 0.5) / 22) * W;
  const t = (x % (W / 2)) / (W / 2);
  const y = (1 - t) ** 2 * 18 + 2 * (1 - t) * t * 90 + t ** 2 * 18;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="url(#glow)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#ffd27a"/>`;
}).join("");
let bx = 0;
const city = [];
while (bx < W) {
  const w = 30 + Math.floor(rnd() * 60);
  const h = 60 + Math.floor(rnd() * 150);
  city.push(`<rect x="${bx}" y="${H - 40 - h}" width="${w}" height="${h + 40}" fill="#160f30"/>`);
  for (let wy = H - 40 - h + 10; wy < H - 50; wy += 16) for (let wx = bx + 6; wx < bx + w - 6; wx += 12) if (rnd() > 0.6) city.push(`<rect x="${wx}" y="${wy}" width="5" height="7" fill="#ffd68a" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}"/>`);
  bx += w + 4;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0b2a"/><stop offset=".6" stop-color="#3a1440"/><stop offset="1" stop-color="#5c0f22"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffc65a" stop-opacity=".55"/><stop offset="1" stop-color="#ffc65a" stop-opacity="0"/></radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0514" stop-opacity="0"/><stop offset="1" stop-color="#0a0514" stop-opacity=".85"/></linearGradient>
    <radialGradient id="hglow"><stop offset="0" stop-color="#ff7aa8" stop-opacity=".7"/><stop offset="1" stop-color="#ff7aa8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <path d="M0 18 Q${W / 4} 90 ${W / 2} 18 Q${(3 * W) / 4} 90 ${W} 18" fill="none" stroke="#3a2418" stroke-width="2"/>
  ${bulbs}
  ${city.join("")}
  <circle cx="${W / 2}" cy="300" r="200" fill="url(#hglow)"/>
  <path d="${heart}" transform="translate(${W / 2 - 132} 150) scale(11)" fill="#ffc2d4"/>
  <rect x="0" y="420" width="${W}" height="${H - 420}" fill="url(#fade)"/>
  <text x="${W / 2}" y="540" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="56" fill="#ffffff">A little love story for you</text>
</svg>`;

fs.mkdirSync("public/og", { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/love-story.png");
console.log("wrote public/og/love-story.png");
