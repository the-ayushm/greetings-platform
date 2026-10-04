import type { ScrapbookContent } from "../schema";

const VAR: Record<keyof ScrapbookContent["theme"], string> = {
  pink: "--pink",
  blush: "--blush",
  baby: "--baby",
  cream: "--cream",
  lavender: "--lav",
  red: "--red",
  ink: "--ink",
};

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** color-mix(in srgb, c p%, transparent) === c at alpha p. */
const alpha = (hex: string, p: number) => `rgba(${rgb(hex).join(",")},${p / 100})`;
/** color-mix(in srgb, c p%, #fff) */
const tintWhite = (hex: string, p: number) =>
  `rgb(${rgb(hex)
    .map((v) => Math.round(v * (p / 100) + 255 * (1 - p / 100)))
    .join(",")})`;

/**
 * CSS custom properties for a theme: the 7 palette variables (validated #rrggbb only) plus the
 * precomputed --cm-* values used by the color-mix() fallback block in scrapbook.css.
 */
export function themeVars(t: ScrapbookContent["theme"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(VAR) as (keyof typeof VAR)[]) out[VAR[k]] = t[k];
  const mixes: [string, string, number][] = [
    ["pink", t.pink, 38], ["pink", t.pink, 45], ["pink", t.pink, 50], ["pink", t.pink, 60], ["pink", t.pink, 80],
    ["lav", t.lavender, 55], ["blush", t.blush, 70], ["blush", t.blush, 80], ["baby", t.baby, 88],
    ["red", t.red, 35], ["red", t.red, 40], ["red", t.red, 45], ["ink", t.ink, 40], ["ink", t.ink, 45],
  ];
  for (const [name, hex, p] of mixes) out[`--cm-${name}-${p}`] = alpha(hex, p);
  out["--cm-red-70-white"] = tintWhite(t.red, 70);
  return out;
}

export function applyTheme(t: ScrapbookContent["theme"], el: HTMLElement = document.documentElement) {
  const vars = themeVars(t);
  for (const k in vars) el.style.setProperty(k, vars[k]!);
}
