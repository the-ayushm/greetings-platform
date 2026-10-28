/**
 * Renders the generic link-preview image for wedding invitations (public/og/wedding.png):
 * a burgundy envelope with gold edges and a blank wax seal. Generic on purpose: link previews
 * never show the couple's names or photos.
 * Run: node scripts/make-wedding-og.mjs
 */
import fs from "node:fs";
import sharp from "sharp";

const W = 1200;
const H = 630;
const cx = W / 2;
const cy = 300;

const wax =
  "M0-47C9-47 13-42 21-43C29-44 31-37 37-33C44-29 41-21 45-15C49-8 44-3 46 4C48 12 42 15 41 22C39 30 32 30 28 36C23 43 16 40 9 44C2 48-4 43-11 45C-19 47-22 40-29 37C-36 33-36 26-41 21C-46 15-43 8-46 1C-48-7-42-11-42-18C-42-26-35-28-31-34C-26-41-19-39-12-43C-6-47-4-47 0-47Z";
const heart = "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z";

// Envelope: 700×420 centred, flaps meeting a little below the middle.
const ex = cx - 350;
const ey = 90;
const ew = 700;
const eh = 420;
const mx = cx;
const my = ey + eh * 0.55;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#6a2033"/><stop offset="1" stop-color="#2a0c14"/></radialGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3d111c"/><stop offset=".5" stop-color="#5b1727"/><stop offset="1" stop-color="#3d111c"/></linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b2234"/><stop offset="1" stop-color="#4a1220"/></linearGradient>
    <radialGradient id="wax" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff3ec"/><stop offset=".5" stop-color="#f2c9bb"/><stop offset="1" stop-color="#d79a8a"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#e8c98a" stop-opacity=".45"/><stop offset="1" stop-color="#e8c98a" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="360" fill="url(#glow)"/>
  <g filter="url(#shadow)">
    <rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="10" fill="url(#side)"/>
    <path d="M${ex} ${ey + eh}L${mx} ${my}L${ex + ew} ${ey + eh}Z" fill="#3a0f1a"/>
    <path d="M${ex} ${ey}L${mx} ${my}L${ex + ew} ${ey}Z" fill="url(#top)"/>
  </g>
  <path d="M${ex} ${ey}L${mx} ${my}L${ex + ew} ${ey}M${ex} ${ey + eh}L${mx} ${my}L${ex + ew} ${ey + eh}" fill="none" stroke="#c9a25f" stroke-width="2.5"/>
  <rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" rx="10" fill="none" stroke="#c9a25f" stroke-width="2"/>
  <g transform="translate(${mx} ${my}) scale(1.35)">
    <path d="${wax}" fill="url(#wax)"/>
    <circle r="31" fill="none" stroke="#a05a50" stroke-opacity=".35" stroke-width="1.4"/>
    <path d="${heart}" transform="translate(-14 -15) scale(1.2)" fill="#b8706a" opacity=".75"/>
  </g>
  <text x="${cx}" y="585" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="50" fill="#f5e6c8">You're invited</text>
</svg>`;

fs.mkdirSync("public/og", { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og/wedding.png");
console.log("wrote public/og/wedding.png");
