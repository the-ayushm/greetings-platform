import type { AskTheme } from "./schema";

type Palette = Omit<AskTheme, "preset">;

/** Built-in looks. "custom" keeps whatever the customer picked in the colour editor. */
export const THEME_PRESETS: Record<Exclude<AskTheme["preset"], "custom">, { label: string; palette: Palette }> = {
  rose: {
    label: "Rose Blush",
    palette: { bg1: "#ffc4cf", bg2: "#fff0ea", card: "#fffaf7", ink: "#5b2333", accent: "#e0445f", yes: "#1f9e6e", no: "#e5484d", gold: "#e3c08a" },
  },
  peach: {
    label: "Peach Sorbet",
    palette: { bg1: "#ffcdb8", bg2: "#fff4e8", card: "#fffaf4", ink: "#5c2d24", accent: "#ec5a52", yes: "#22a174", no: "#e2524a", gold: "#eec486" },
  },
  lavender: {
    label: "Lavender Dream",
    palette: { bg1: "#dccdfb", bg2: "#ffeef6", card: "#fffbfe", ink: "#3f2a5c", accent: "#c24f95", yes: "#2a9f78", no: "#de4766", gold: "#e2c69e" },
  },
  cherry: {
    label: "Midnight Cherry",
    palette: { bg1: "#4a1028", bg2: "#1a0a17", card: "#2b1222", ink: "#ffeaf0", accent: "#ff6b8b", yes: "#25ad7b", no: "#f2475a", gold: "#f0cd92" },
  },
};

export const DEFAULT_THEME: AskTheme = { preset: "rose", ...THEME_PRESETS.rose.palette };

export function presetTheme(key: keyof typeof THEME_PRESETS): AskTheme {
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
export const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;

/** Relative luminance (WCAG) — used to keep text readable on any custom colour. */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const isDark = (hex: string) => luminance(hex) < 0.2;

/**
 * CSS custom properties for a theme. Colours are validated #rrggbb (schema), so every value is
 * a plain colour — safe in a style attribute. Shades are mixed here rather than with
 * color-mix() so older Android WebViews (WhatsApp / Instagram in-app browsers) render the same.
 */
export function themeVars(t: AskTheme): Record<string, string> {
  const dark = isDark(t.card);
  // Button text stays white unless a customer picks a very light button colour.
  const onYes = luminance(t.yes) > 0.45 ? mix(t.yes, "#000000", 0.75) : "#ffffff";
  const onNo = luminance(t.no) > 0.45 ? mix(t.no, "#000000", 0.75) : "#ffffff";
  return {
    "--dy-bg1": t.bg1,
    "--dy-bg2": t.bg2,
    "--dy-bg-glow": alpha(mix(t.bg1, "#ffffff", 0.55), 0.85),
    "--dy-card": alpha(t.card, dark ? 0.82 : 0.74),
    "--dy-card-solid": t.card,
    "--dy-card-edge": dark ? alpha("#ffffff", 0.12) : alpha("#ffffff", 0.85),
    "--dy-ink": t.ink,
    "--dy-ink-soft": mix(t.ink, t.card, 0.32),
    "--dy-shadow": alpha(dark ? "#000000" : mix(t.ink, t.bg1, 0.3), dark ? 0.55 : 0.28),
    "--dy-accent": t.accent,
    "--dy-accent-soft": mix(t.accent, t.bg2, 0.55),
    "--dy-accent-glow": alpha(t.accent, 0.35),
    "--dy-yes": t.yes,
    "--dy-yes-hi": mix(t.yes, "#ffffff", 0.22),
    "--dy-yes-deep": mix(t.yes, "#000000", 0.24),
    "--dy-yes-glow": alpha(t.yes, 0.45),
    "--dy-on-yes": onYes,
    "--dy-no": t.no,
    "--dy-no-hi": mix(t.no, "#ffffff", 0.2),
    "--dy-no-deep": mix(t.no, "#000000", 0.18),
    "--dy-no-glow": alpha(t.no, 0.35),
    "--dy-on-no": onNo,
    "--dy-gold": t.gold,
    "--dy-gold-soft": alpha(t.gold, 0.55),
    "--dy-heart-1": t.accent,
    "--dy-heart-2": mix(t.accent, "#ffffff", 0.45),
    "--dy-heart-3": dark ? alpha("#ffffff", 0.7) : "#ffffff",
  };
}
