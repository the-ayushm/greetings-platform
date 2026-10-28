import type { LoveTheme } from "./schema";

type Palette = Pick<LoveTheme, "primary" | "secondary" | "background" | "paper" | "text" | "button">;
type Preset = { label: string; palette: Palette; fonts: LoveTheme["fonts"]; border: LoveTheme["border"]; backdrop: LoveTheme["backdrop"] };

/** Built-in looks. "custom" keeps whatever the customer picked in the colour editor. */
export const THEME_PRESETS: Record<Exclude<LoveTheme["preset"], "custom">, Preset> = {
  cherry: {
    label: "Cherry Romance",
    palette: { primary: "#e0436b", secondary: "#f6b3c6", background: "#5c0f22", paper: "#fbefe3", text: "#4a1626", button: "#d93a64" },
    fonts: "romantic",
    border: "ribbon",
    backdrop: "night",
  },
  pink: {
    label: "Pink Dream",
    palette: { primary: "#ec5b8f", secondary: "#ffd0df", background: "#b8466e", paper: "#fff4f7", text: "#5a2340", button: "#ee6a9a" },
    fonts: "playful",
    border: "lace",
    backdrop: "gradient",
  },
  midnight: {
    label: "Midnight Love",
    palette: { primary: "#ff7aa8", secondary: "#c9b6ff", background: "#141238", paper: "#f6f0ff", text: "#2a2350", button: "#ff6f9f" },
    fonts: "classic",
    border: "simple",
    backdrop: "night",
  },
  vintage: {
    label: "Vintage Scrapbook",
    palette: { primary: "#b5523b", secondary: "#e8c9a0", background: "#4b2e22", paper: "#f4e7d0", text: "#3e2a1e", button: "#a9452f" },
    fonts: "storybook",
    border: "ribbon",
    backdrop: "paper",
  },
  pastel: {
    label: "Soft Pastel",
    palette: { primary: "#e889a8", secondary: "#bfe3dc", background: "#e7d6f2", paper: "#fffaf4", text: "#5b4660", button: "#e07a9e" },
    fonts: "playful",
    border: "simple",
    backdrop: "gradient",
  },
};

export function presetTheme(key: keyof typeof THEME_PRESETS, base: Pick<LoveTheme, "motion" | "hearts" | "sparkles" | "lights">): LoveTheme {
  const p = THEME_PRESETS[key];
  return { preset: key, ...p.palette, fonts: p.fonts, border: p.border, backdrop: p.backdrop, ...base };
}

export const FONT_LABELS: Record<LoveTheme["fonts"], string> = {
  romantic: "Handwritten + rounded",
  classic: "Elegant serif + rounded",
  playful: "All handwritten",
  storybook: "Storybook serif",
};

const FONT_STACKS: Record<LoveTheme["fonts"], [display: string, body: string]> = {
  romantic: ["'Caveat','Segoe Print',cursive", "'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif"],
  classic: ["'Fraunces',Georgia,serif", "'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif"],
  playful: ["'Caveat','Segoe Print',cursive", "'Caveat','Segoe Print',cursive"],
  storybook: ["'Fraunces',Georgia,serif", "'Fraunces',Georgia,serif"],
};

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

/** Relative luminance (WCAG) — picks readable text on buttons. */
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * CSS custom properties for a theme. Colours are validated #rrggbb (schema), so every value
 * here is a plain colour or a font stack — safe to put in a style attribute. Mixed shades are
 * computed here rather than with color-mix() so old Android WebViews render the same.
 */
export function themeVars(t: LoveTheme): Record<string, string> {
  const [display, body] = FONT_STACKS[t.fonts];
  const nightTop = mix(t.background, "#070a24", 0.72);
  const nightBottom = mix(t.background, "#1b0f2e", 0.35);
  return {
    "--lu-primary": t.primary,
    "--lu-secondary": t.secondary,
    "--lu-bg": t.background,
    "--lu-bg-deep": mix(t.background, "#000000", 0.35),
    "--lu-paper": t.paper,
    "--lu-paper-2": mix(t.paper, t.secondary, 0.22),
    "--lu-paper-edge": mix(t.paper, t.text, 0.14),
    "--lu-text": t.text,
    "--lu-text-soft": mix(t.text, t.paper, 0.3),
    "--lu-button": t.button,
    "--lu-button-2": mix(t.button, "#ffffff", 0.22),
    "--lu-button-ink": luminance(t.button) > 0.45 ? t.text : "#ffffff",
    "--lu-glow": alpha(t.primary, 0.55),
    "--lu-glow-soft": alpha(t.secondary, 0.4),
    "--lu-night-top": nightTop,
    "--lu-night-bottom": nightBottom,
    "--lu-heart": t.primary,
    "--lu-heart-soft": mix(t.primary, "#ffffff", 0.45),
    "--lu-chip": mix(t.paper, t.primary, 0.12),
    "--lu-display": display,
    "--lu-body": body,
  };
}

/** Floating-heart count per motion level (0 when the visitor prefers reduced motion). */
export const MOTION_HEARTS: Record<LoveTheme["motion"], number> = { off: 0, subtle: 7, lively: 16 };
