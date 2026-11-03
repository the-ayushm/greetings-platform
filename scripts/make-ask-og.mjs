/**
 * Renders the generic link-preview image for "Do You Love Me?" pages
 * (public/og/do-you-love-me.png): a blush card with the question, a big green Yes and a tiny
 * red No. Generic on purpose: link previews never show names or photos.
 * Run: node scripts/make-ask-og.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;
const heart = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";
const sparkle = "M12 1.5 13.9 10.1 22.5 12 13.9 13.9 12 22.5 10.1 13.9 1.5 12 10.1 10.1Z";

const hearts = [
  [90, 470, 2.6, "#e0445f", 0.28],
  [180, 120, 1.8, "#ffffff", 0.85],
  [1050, 90, 2.2, "#e0445f", 0.3],
  [1110, 470, 3.1, "#ffffff", 0.8],
  [985, 540, 1.5, "#ff9fb2", 0.7],
  [250, 545, 1.4, "#ff9fb2", 0.7],
]
  .map(([x, y, s, c, o]) => `<path d="${heart}" transform="translate(${x} ${y}) scale(${s})" fill="${c}" opacity="${o}"/>`)
  .join("");
const sparkles = [
  [140, 300, 1.1],
  [1060, 280, 1.3],
  [330, 70, 0.8],
  [870, 560, 0.9],
]
  .map(([x, y, s]) => `<path d="${sparkle}" transform="translate(${x} ${y}) scale(${s})" fill="#e3c08a" opacity=".9"/>`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc4cf"/><stop offset="1" stop-color="#fff0ea"/></linearGradient>
    <radialGradient id="glow" cx=".2" cy=".1" r=".6"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <linearGradient id="yes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cb68c"/><stop offset=".55" stop-color="#1f9e6e"/><stop offset="1" stop-color="#177854"/></linearGradient>
    <linearGradient id="no" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ea6d70"/><stop offset="1" stop-color="#d23b40"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="30" flood-color="#5b2333" flood-opacity=".28"/></filter>
    <filter id="soft" x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1f9e6e" flood-opacity=".45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${hearts}
  ${sparkles}
  <g filter="url(#shadow)">
    <rect x="240" y="70" width="720" height="490" rx="44" fill="#fffaf7" fill-opacity=".92"/>
  </g>
  <rect x="254" y="84" width="692" height="462" rx="34" fill="none" stroke="#e3c08a" stroke-opacity=".7" stroke-width="2"/>
  <text x="600" y="168" text-anchor="middle" font-family="'Segoe Print', 'Comic Sans MS', cursive" font-size="34" fill="#e0445f">I have a little question…</text>
  <text x="600" y="262" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" font-size="68" fill="#5b2333">Do you love me?</text>
  <path d="${heart}" transform="translate(568 290) scale(2.7)" fill="#e0445f"/>
  <g filter="url(#soft)">
    <rect x="370" y="388" width="300" height="118" rx="34" fill="url(#yes)"/>
  </g>
  <text x="520" y="468" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="60" fill="#ffffff">Yes</text>
  <rect x="704" y="426" width="126" height="44" rx="22" fill="url(#no)"/>
  <text x="767" y="455" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="17" fill="#ffffff">Are you sure?</text>
</svg>`;

fs.mkdirSync("public/og", { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/do-you-love-me.png");
console.log("wrote public/og/do-you-love-me.png");
