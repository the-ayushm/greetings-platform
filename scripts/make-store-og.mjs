/**
 * Renders the store's link-preview image (public/og/digital-gifting.png): the brand name on a
 * warm cream background with soft cards in each product's colours.
 * Run: node scripts/make-store-og.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;
const heart = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

// Four phones in the products' palettes, fanned on the right.
const phones = [
  { x: 690, y: 150, r: -10, a: "#ffd7e2", b: "#fff6f8", label: "Birthday" },
  { x: 820, y: 95, r: 0, a: "#3a1440", b: "#6b1a35", label: "Love Story" },
  { x: 950, y: 150, r: 10, a: "#5b1727", b: "#7a2840", label: "Wedding" },
]
  .map(
    (p, i) => `<g transform="translate(${p.x} ${p.y}) rotate(${p.r} 70 150)">
      <rect width="150" height="320" rx="26" fill="#2a1219"/>
      <rect x="8" y="8" width="134" height="304" rx="19" fill="url(#ph${i})"/>
      <path d="${heart}" transform="translate(51 110) scale(2)" fill="${i === 0 ? "#e0445f" : "#ffb3c6"}" opacity=".9"/>
      <text x="75" y="210" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="20" fill="${i === 0 ? "#5b2333" : "#fdeef2"}">${p.label}</text>
    </g>
    <defs><linearGradient id="ph${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient></defs>`,
  )
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx=".9" cy="0" r=".7"><stop offset="0" stop-color="#f59ab8" stop-opacity=".35"/><stop offset="1" stop-color="#f59ab8" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy=".2" r=".6"><stop offset="0" stop-color="#e9cf9f" stop-opacity=".35"/><stop offset="1" stop-color="#e9cf9f" stop-opacity="0"/></radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0445f"/><stop offset="1" stop-color="#a32f45"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#fff8ec"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect x="80" y="150" width="64" height="64" rx="18" fill="url(#mark)"/>
  <path d="${heart}" transform="translate(94 163) scale(1.5)" fill="#fff"/>
  <text x="80" y="300" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="72" fill="#4a1d2c">Digital Gifting</text>
  <text x="80" y="370" font-family="Georgia, serif" font-size="34" fill="#c13a52">Make every moment unforgettable ♡</text>
  <text x="80" y="440" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="#8a5468">Birthday surprises · Love stories · Romantic questions</text>
  <text x="80" y="474" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="#8a5468">Wedding invitations — one private link</text>
  ${phones}
</svg>`;

fs.mkdirSync("public/og", { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/digital-gifting.png");
console.log("wrote public/og/digital-gifting.png");
