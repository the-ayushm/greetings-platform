"use client";

import { BACKDROPS, BORDERS, FONT_PAIRS, MOTION, type LoveTheme, type SectionId } from "@/templates/lovestory/schema";
import { FONT_LABELS, presetTheme, THEME_PRESETS } from "@/templates/lovestory/theme";
import { Text } from "../../fields";
import { ColorField, move, Panel, Select, Toggle } from "../controls";
import type { PanelProps } from "../types";

const COLORS: [keyof LoveTheme & ("primary" | "secondary" | "background" | "paper" | "text" | "button"), string][] = [
  ["primary", "Primary (hearts, accents)"],
  ["secondary", "Secondary (soft glow)"],
  ["background", "Background & frame"],
  ["paper", "Paper cards"],
  ["text", "Text"],
  ["button", "Buttons"],
];

export function ThemePanel({ c, edit }: PanelProps) {
  const t = c.theme;
  const keep = { motion: t.motion, hearts: t.hearts, sparkles: t.sparkles, lights: t.lights };
  return (
    <div className="space-y-5">
      <Panel title="Theme" hint="Pick a look, then fine-tune anything. The preview updates as you go.">
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme preset">
          {(Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]).map((k) => {
            const p = THEME_PRESETS[k];
            const active = t.preset === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={active} onClick={() => edit((d) => void (d.theme = presetTheme(k, keep)))} className={`rounded-xl border-2 p-3 text-left transition ${active ? "border-rose bg-baby/60" : "border-ink/15 hover:border-ink/40"}`}>
                <span className="flex overflow-hidden rounded-lg border border-ink/10">
                  {[p.palette.background, p.palette.primary, p.palette.secondary, p.palette.paper, p.palette.button].map((col, i) => (
                    <span key={i} className="h-8 flex-1" style={{ background: col }} />
                  ))}
                </span>
                <span className="mt-2 block text-sm font-bold">{p.label}</span>
              </button>
            );
          })}
          <button type="button" role="radio" aria-checked={t.preset === "custom"} onClick={() => edit((d) => void (d.theme.preset = "custom"))} className={`rounded-xl border-2 p-3 text-left ${t.preset === "custom" ? "border-rose bg-baby/60" : "border-dashed border-ink/20 hover:border-ink/40"}`}>
            <span className="block h-8 rounded-lg" style={{ background: `linear-gradient(90deg, ${t.background}, ${t.primary}, ${t.secondary}, ${t.paper})` }} />
            <span className="mt-2 block text-sm font-bold">Custom theme</span>
            <span className="block text-xs text-ink-soft">Change any colour below</span>
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {COLORS.map(([k, label]) => (
            <ColorField
              key={k}
              label={label}
              value={t[k]}
              onChange={(v) =>
                edit((d) => {
                  d.theme[k] = v;
                  d.theme.preset = "custom";
                })
              }
            />
          ))}
        </div>
      </Panel>
      <Panel title="Style & effects">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Fonts" value={t.fonts} options={FONT_PAIRS.map((f) => [f, FONT_LABELS[f]] as const)} onChange={(v) => edit((d) => void (d.theme.fonts = v))} />
          <Select
            label="Border style"
            value={t.border}
            options={BORDERS.map((b) => [b, { ribbon: "Burgundy ribbon frame", lace: "Lace dashes", simple: "Simple line", none: "No border" }[b]] as const)}
            onChange={(v) => edit((d) => void (d.theme.border = v))}
          />
          <Select
            label="Background"
            value={t.backdrop}
            options={BACKDROPS.map((b) => [b, { night: "Warm night glow", paper: "Kraft paper", gradient: "Soft gradient", plain: "Plain colour" }[b]] as const)}
            onChange={(v) => edit((d) => void (d.theme.backdrop = v))}
          />
          <Select
            label="Animation"
            value={t.motion}
            options={MOTION.map((m) => [m, { off: "Off (still)", subtle: "Subtle", lively: "Lively" }[m]] as const)}
            onChange={(v) => edit((d) => void (d.theme.motion = v))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle label="Floating hearts" checked={t.hearts} onChange={(v) => edit((d) => void (d.theme.hearts = v))} />
          <Toggle label="Sparkles" checked={t.sparkles} onChange={(v) => edit((d) => void (d.theme.sparkles = v))} />
          <Toggle label="Fairy lights" checked={t.lights} onChange={(v) => edit((d) => void (d.theme.lights = v))} />
        </div>
        <p className="text-xs text-ink-soft">Visitors who ask their phone for reduced motion always get a calm, still version.</p>
      </Panel>
    </div>
  );
}

export const SECTION_LABEL: Record<SectionId, string> = {
  quiz: "Questions (2–7)",
  unlock: "Unlocking envelope (8)",
  timeline: "Our story timeline (9)",
  scrapbook: "Memories scrapbook (10)",
  calendar: "Special dates calendar (11)",
  letter: "Love letter (12)",
  coupons: "Love coupons (13)",
  photowall: "Photo wall (14)",
};

export function SectionsPanel({ c, edit }: PanelProps) {
  const s = c.sections;
  return (
    <div className="space-y-5">
      <Panel title="Sections" hint="Switch pages on or off and change their order. The welcome page always opens the story and the final surprise always ends it.">
        <ol className="space-y-2">
          <li className="rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">1 · Welcome page (always first)</li>
          {s.map((x, i) => (
            <li key={x.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 ${x.enabled ? "border-ink/15 bg-white" : "border-dashed border-ink/15 bg-ink/5"}`}>
              <Toggle label={SECTION_LABEL[x.id]} checked={x.enabled} onChange={(v) => edit((d) => void (d.sections[i]!.enabled = v))} />
              <span className="flex gap-1 text-xs font-bold">
                <button type="button" className="rounded px-2 py-1 hover:bg-baby disabled:opacity-30" disabled={i === 0} onClick={() => edit((d) => void (d.sections = move(d.sections, i, i - 1)))} aria-label={`Move ${SECTION_LABEL[x.id]} up`}>
                  ↑
                </button>
                <button type="button" className="rounded px-2 py-1 hover:bg-baby disabled:opacity-30" disabled={i === s.length - 1} onClick={() => edit((d) => void (d.sections = move(d.sections, i, i + 1)))} aria-label={`Move ${SECTION_LABEL[x.id]} down`}>
                  ↓
                </button>
              </span>
            </li>
          ))}
          <li className="rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">15 · Final surprise (always last)</li>
        </ol>
      </Panel>
      <Panel title="Their responses (privacy)" hint="Off by default. When on, what they type in “their own words” questions, where they set the love slider, and which coupons they redeem is sent privately to you.">
        <Toggle
          label="Collect their responses"
          checked={c.responses.collect}
          onChange={(v) => edit((d) => void (d.responses.collect = v))}
          hint={c.responses.collect ? "On: the page tells them their answer is shared with you. You'll find answers under Share & settings, and can delete them any time." : "Off: answers stay on their screen only and are never saved."}
        />
      </Panel>
      <Panel title="Button wording">
        <div className="grid gap-4 sm:grid-cols-3">
          <Text label="Next" required max={20} value={c.copy.next} onChange={(v) => edit((d) => void (d.copy.next = v))} />
          <Text label="Back" required max={20} value={c.copy.back} onChange={(v) => edit((d) => void (d.copy.back = v))} />
          <Text label="Start again" required max={24} value={c.copy.restart} onChange={(v) => edit((d) => void (d.copy.restart = v))} />
        </div>
      </Panel>
    </div>
  );
}
