"use client";

import { SUGGESTED_NO_MESSAGES } from "@/templates/doyouloveme/defaults";
import { Buddy } from "@/templates/doyouloveme/art";
import { CHARACTERS, MAX_NO_MESSAGES, MIN_NO_MESSAGES, type AskContent, type AskTheme, type Character, type Intensity } from "@/templates/doyouloveme/schema";
import { presetTheme, THEME_PRESETS } from "@/templates/doyouloveme/theme";
import type { LibraryAsset } from "../upload";
import { AudioPicker, PhotoPicker, Text } from "../fields";
import { AddButton, ColorField, Item, move, Panel, Select, Toggle } from "../love/controls";

/** Panels of the "Do You Love Me?" studio. Every field writes straight into the draft. */

export type Edit = (fn: (d: AskContent) => void) => void;
export type Lib = { siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> };
export type PanelProps = { c: AskContent; edit: Edit; lib: Lib };

const Tokens = () => (
  <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink-soft">
    Tip: write <b>{"{partner}"}</b> or <b>{"{sender}"}</b> anywhere — they&apos;re replaced with the names automatically.
  </p>
);

export function QuestionPanel({ c, edit }: PanelProps) {
  const q = c.question;
  return (
    <div className="space-y-5">
      <Panel title="The two of you" hint="Required before you publish. Their name appears in the greeting; yours signs the final message.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Their name" name="partnerName" required max={40} value={c.people.partnerName} onChange={(v) => edit((d) => void (d.people.partnerName = v))} placeholder="e.g. Riya" />
          <Text label="Your name" name="senderName" required max={40} value={c.people.senderName} onChange={(v) => edit((d) => void (d.people.senderName = v))} placeholder="e.g. Aarav" />
        </div>
      </Panel>
      <Panel title="Opening words" hint="The little lines above the question.">
        <Text label="Greeting" max={60} value={c.intro.greeting} onChange={(v) => edit((d) => void (d.intro.greeting = v))} />
        <Text label="Message" multiline max={200} value={c.intro.message} onChange={(v) => edit((d) => void (d.intro.message = v))} />
        <Tokens />
      </Panel>
      <Panel title="The question" hint="Ask anything with a yes — “Will you be my Valentine?”, “Will you marry me?”…">
        <Text label="Question" required max={80} value={q.text} onChange={(v) => edit((d) => void (d.question.text = v))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Yes button" required max={24} value={q.yesText} onChange={(v) => edit((d) => void (d.question.yesText = v))} />
          <Text label="No button (before any “No”)" required max={24} value={q.noText} onChange={(v) => edit((d) => void (d.question.noText = v))} />
        </div>
      </Panel>
    </div>
  );
}

export function NoPanel({ c, edit }: PanelProps) {
  const list = c.question.noMessages;
  const n = list.length;
  return (
    <div className="space-y-5">
      <Panel
        title="What “No” says"
        hint={`Each press of No shows the next line and makes YES bigger. After the last line, one more “No” makes YES fill the whole screen. ${MIN_NO_MESSAGES}–${MAX_NO_MESSAGES} lines.`}
        actions={
          <button type="button" className="rounded-lg border-2 border-ink/15 px-3 py-1.5 text-sm font-bold hover:bg-baby" onClick={() => edit((d) => void (d.question.noMessages = [...SUGGESTED_NO_MESSAGES]))}>
            Restore our suggestions
          </button>
        }
      >
        <ol className="space-y-3">
          {list.map((m, i) => (
            <li key={i}>
              <Item
                label={`Press ${i + 1}`}
                index={i}
                count={n}
                min={1}
                onMove={(to) => edit((d) => void (d.question.noMessages = move(d.question.noMessages, i, to)))}
                onRemove={() => edit((d) => void d.question.noMessages.splice(i, 1))}
                badge={<GrowthBar value={(i + 1) / n} />}
              >
                <Text label={`Line ${i + 1}`} required max={48} value={m} onChange={(v) => edit((d) => void (d.question.noMessages[i] = v))} />
              </Item>
            </li>
          ))}
        </ol>
        <AddButton disabled={n >= MAX_NO_MESSAGES} onClick={() => edit((d) => void d.question.noMessages.push(""))}>
          + Add a line
        </AddButton>
        {n < MIN_NO_MESSAGES && <p className="text-sm text-rose">Add at least {MIN_NO_MESSAGES} lines before you publish.</p>}
      </Panel>
      <Panel title="The full-screen YES" hint="When YES has taken over the whole screen, this little line sits under it.">
        <Text label="Line under the big YES" max={60} value={c.question.takeoverHint} onChange={(v) => edit((d) => void (d.question.takeoverHint = v))} />
      </Panel>
    </div>
  );
}

/** How big YES is at this step (0–100%). */
function GrowthBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f9e6e]" title="How big YES gets">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        <span className="block h-full rounded-full bg-[#1f9e6e]" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="sr-only">YES size {Math.round(value * 100)}%</span>
    </span>
  );
}

export function FinalePanel({ c, edit, lib }: PanelProps) {
  const f = c.finale;
  return (
    <div className="space-y-5">
      <Panel title="The celebration" hint="What they see after pressing YES: hearts, confetti, your words.">
        <Text label="Big heading" required max={60} value={f.heading} onChange={(v) => edit((d) => void (d.finale.heading = v))} />
        <Text label="Line under it" max={120} value={f.subheading} onChange={(v) => edit((d) => void (d.finale.subheading = v))} />
        <Text label="Your love message" multiline max={600} value={f.message} onChange={(v) => edit((d) => void (d.finale.message = v))} placeholder="Write something only you could say…" />
        <Text label="Signature" max={60} value={f.signature} onChange={(v) => edit((d) => void (d.finale.signature = v))} />
        <Tokens />
      </Panel>
      <Panel title="A photo of you two (optional)" hint="Shown as a polaroid above the heading. Location data is removed automatically.">
        <PhotoPicker label="Photo" value={f.photo} onChange={(r) => edit((d) => void (d.finale.photo = r))} {...lib} />
      </Panel>
      <Panel title="Replay">
        <Toggle label="Show an “Ask me again” button" checked={f.replay} onChange={(v) => edit((d) => void (d.finale.replay = v))} hint="Lets them go through it again (or show a friend)." />
      </Panel>
    </div>
  );
}

const CHARACTER_LABEL: Record<Character, string> = { bunny: "Bunny", bear: "Bear", kitty: "Kitty", mochi: "Mochi", none: "No character" };
const INTENSITY_LABEL: Record<Intensity, string> = { calm: "Calm — soft and minimal", playful: "Playful — our favourite", extra: "Extra — hearts everywhere" };
const COLORS: [keyof Omit<AskTheme, "preset">, string][] = [
  ["bg1", "Background (top)"],
  ["bg2", "Background (bottom)"],
  ["card", "Card"],
  ["ink", "Text"],
  ["accent", "Hearts & headings"],
  ["yes", "YES button"],
  ["no", "NO button"],
  ["gold", "Sparkles & trim"],
];

export function LookPanel({ c, edit }: PanelProps) {
  const t = c.theme;
  return (
    <div className="space-y-5">
      <Panel title="Character" hint="An original little buddy who gets sadder with every “No” — and jumps for joy at YES.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Character">
          {CHARACTERS.map((k) => {
            const active = c.look.character === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => edit((d) => void (d.look.character = k))}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-bold transition ${active ? "border-rose bg-baby/60" : "border-ink/15 hover:border-ink/40"}`}
              >
                <span className="grid size-16 place-items-center" style={{ "--dy-accent": t.accent } as React.CSSProperties}>
                  {k === "none" ? <span className="text-2xl text-ink-soft">∅</span> : <Buddy kind={k} mood="ask" className="size-16" />}
                </span>
                {CHARACTER_LABEL[k]}
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title="Animation" hint="How much floats, sparkles and falls. Visitors who prefer reduced motion always get a calm version.">
        <Select label="Amount of animation" value={c.look.intensity} options={(Object.keys(INTENSITY_LABEL) as Intensity[]).map((k) => [k, INTENSITY_LABEL[k]] as const)} onChange={(v) => edit((d) => void (d.look.intensity = v))} />
      </Panel>
      <Panel title="Colours" hint="Pick a palette, then fine-tune any colour.">
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Palette">
          {(Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]).map((k) => {
            const p = THEME_PRESETS[k];
            const active = t.preset === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={active} onClick={() => edit((d) => void (d.theme = presetTheme(k)))} className={`rounded-xl border-2 p-3 text-left transition ${active ? "border-rose bg-baby/60" : "border-ink/15 hover:border-ink/40"}`}>
                <span className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-lg border border-ink/10" style={{ background: `linear-gradient(150deg, ${p.palette.bg1}, ${p.palette.bg2})` }}>
                  <span className="rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ background: p.palette.yes }}>
                    Yes
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: p.palette.no }}>
                    No
                  </span>
                  <span className="absolute top-1.5 right-2 text-sm" style={{ color: p.palette.accent }} aria-hidden="true">
                    ♥
                  </span>
                </span>
                <span className="mt-2 block text-sm font-bold">{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {COLORS.map(([k, label]) => (
            <ColorField key={k} label={label} value={t[k]} onChange={(v) => edit((d) => void ((d.theme[k] = v), (d.theme.preset = "custom")))} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function MusicPanel({ c, edit, lib }: PanelProps) {
  const m = c.music;
  return (
    <div className="space-y-5">
      <Panel title="Background music" hint="Never plays when the page opens. It can start when they press YES (that tap is their permission), and there's always a sound button.">
        <Select
          label="Music"
          value={m.mode}
          options={[
            ["musicbox", "Built-in music-box tune (original)"],
            ["file", "Upload our song"],
            ["none", "No music"],
          ]}
          onChange={(v) => edit((d) => void (d.music.mode = v))}
        />
        {m.mode !== "none" && (
          <>
            <Text label="Song title (for your reference)" max={60} value={m.title} onChange={(v) => edit((d) => void (d.music.title = v))} />
            <Toggle label="Start the music when they press YES" checked={m.playOnYes} onChange={(v) => edit((d) => void (d.music.playOnYes = v))} hint="Off: they turn it on with the sound button." />
          </>
        )}
        {m.mode === "file" && <AudioPicker value={m.audio} onChange={(r) => edit((d) => void (d.music.audio = r))} {...lib} />}
      </Panel>
      <Panel title="Little sounds">
        <Toggle label="Soft taps and a chime" checked={c.look.sounds} onChange={(v) => edit((d) => void (d.look.sounds = v))} hint="Only after they switch sound on with the speaker button." />
      </Panel>
    </div>
  );
}

export function AnswerPanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Know when they say yes" hint="We'll show their answer — and how many times they pressed “No” first — on this page's dashboard. Nothing else about them is stored.">
      <Toggle label="Tell me when they say YES" checked={c.responses.notify} onChange={(v) => edit((d) => void (d.responses.notify = v))} hint="They see a small line: “{your name} will know you said yes ♡”." />
    </Panel>
  );
}
