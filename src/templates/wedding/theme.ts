import type { WeddingTheme } from "./schema";

type Palette = Omit<WeddingTheme, "preset">;

/** Built-in looks. "custom" keeps whatever the customer picked in the colour editor. */
export const THEME_PRESETS: Record<Exclude<WeddingTheme["preset"], "custom">, { label: string; palette: Palette }> = {
  royal: {
    label: "Royal Burgundy",
    palette: { wine: "#351018", burgundy: "#5b1727", rose: "#b76e79", gold: "#c9a25f", champagne: "#f5e6c8", blush: "#fcecef", ivory: "#fff8f0" },
  },
  emerald: {
    label: "Emerald & Gold",
    palette: { wine: "#0f2a22", burgundy: "#1d4a3b", rose: "#b9876a", gold: "#c9a25f", champagne: "#efe3c8", blush: "#f3f1e8", ivory: "#fffcf4" },
  },
  midnight: {
    label: "Midnight Navy",
    palette: { wine: "#121a33", burgundy: "#22305a", rose: "#9e8bb0", gold: "#cbb07a", champagne: "#ece4d2", blush: "#eef0f6", ivory: "#fbfaf6" },
  },
  blush: {
    label: "Blush Garden",
    palette: { wine: "#5a2f3a", burgundy: "#8c4a5a", rose: "#d7a1a8", gold: "#c9a77a", champagne: "#f7ead8", blush: "#fdf1f2", ivory: "#fffaf7" },
  },
};

export const DEFAULT_THEME: WeddingTheme = { preset: "royal", ...THEME_PRESETS.royal.palette };

export function presetTheme(key: keyof typeof THEME_PRESETS): WeddingTheme {
  return { preset: key, ...THEME_PRESETS[key].palette };
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: number[]) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
/** a*(1-p) + b*p */
export function mix(a: string, b: string, p: number) {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v * (1 - p) + y[i]! * p));
}
const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;

/**
 * CSS custom properties for a theme. Colours are validated #rrggbb (schema), so every value
 * is a plain colour — safe in a style attribute. Shades are mixed here rather than with
 * color-mix() so older Android WebViews (WhatsApp's in-app browser) render the same.
 */
export function themeVars(t: WeddingTheme): Record<string, string> {
  return {
    "--wd-wine": t.wine,
    "--wd-burgundy": t.burgundy,
    "--wd-burgundy-2": mix(t.burgundy, "#ffffff", 0.12),
    "--wd-rose": t.rose,
    "--wd-rose-soft": mix(t.rose, t.blush, 0.55),
    "--wd-gold": t.gold,
    "--wd-gold-2": mix(t.gold, "#ffffff", 0.35),
    "--wd-gold-deep": mix(t.gold, t.wine, 0.35),
    "--wd-champagne": t.champagne,
    "--wd-blush": t.blush,
    "--wd-blush-2": mix(t.blush, t.rose, 0.18),
    "--wd-ivory": t.ivory,
    "--wd-ink": mix(t.wine, t.burgundy, 0.35),
    "--wd-ink-soft": mix(t.wine, t.blush, 0.38),
    "--wd-emboss-hi": alpha("#ffffff", 0.08),
    "--wd-emboss-lo": alpha(mix(t.wine, "#000000", 0.4), 0.55),
    "--wd-glow": alpha(t.gold, 0.55),
    "--wd-leaf": mix("#5f7a4f", t.wine, 0.15),
    "--wd-leaf-2": mix("#8fa877", t.champagne, 0.2),
  };
}
