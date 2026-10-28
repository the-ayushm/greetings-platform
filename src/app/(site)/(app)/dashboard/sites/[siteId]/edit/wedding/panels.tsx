"use client";

import { useId } from "react";
import { MAX_PARTY, newItemId, type WeddingContent, type WeddingTheme } from "@/templates/wedding/schema";
import { presetTheme, THEME_PRESETS } from "@/templates/wedding/theme";
import { UTC_OFFSETS } from "@/templates/wedding/time";
import type { LibraryAsset } from "../upload";
import { AudioPicker, PhotoPicker, Text } from "../fields";
import { AddButton, ColorField, DateField, Item, move, Panel, Select, Toggle } from "../love/controls";

/** Panels of the wedding invitation studio. Every field writes straight into the draft. */

export type Edit = (fn: (d: WeddingContent) => void) => void;
export type Lib = { siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> };
export type PanelProps = { c: WeddingContent; edit: Edit; lib: Lib };

const Tokens = () => (
  <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink-soft">
    Tip: write <b>{"{bride}"}</b>, <b>{"{groom}"}</b> or <b>{"{date}"}</b> anywhere — they&apos;re filled in automatically.
  </p>
);

function TimeField({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required && <span className="text-rose"> *</span>}
      </label>
      <input id={id} type="time" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose" />
    </div>
  );
}

/** "Meera" + "Arjun" → "M&A". */
const suggestInitials = (a: string, b: string) => [a.trim()[0], b.trim()[0]].filter(Boolean).map((x) => x!.toUpperCase()).join("&");

export function CouplePanel({ c, edit }: PanelProps) {
  const p = c.couple;
  const e = c.event;
  const suggestion = suggestInitials(p.brideName, p.groomName);
  return (
    <div className="space-y-5">
      <Panel title="The couple" hint="Your names are the heart of the cover. Required before you publish.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Bride's name" name="brideName" required max={40} value={p.brideName} onChange={(v) => edit((d) => void (d.couple.brideName = v))} placeholder="e.g. Meera" />
          <Text label="Groom's name" name="groomName" required max={40} value={p.groomName} onChange={(v) => edit((d) => void (d.couple.groomName = v))} placeholder="e.g. Arjun" />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <Text label="Initials on the wax seal" name="initials" required max={6} value={p.initials} onChange={(v) => edit((d) => void (d.couple.initials = v))} placeholder="M&A" />
          </div>
          {suggestion && suggestion !== p.initials && (
            <button type="button" className="mb-1 rounded-lg border-2 border-ink/15 px-3 py-2 text-sm font-bold hover:bg-baby" onClick={() => edit((d) => void (d.couple.initials = suggestion))}>
              Use “{suggestion}”
            </button>
          )}
        </div>
      </Panel>
      <Panel title="Date & time" hint="Powers the cover date, the countdown, the RSVP closing time and “Save the date”.">
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="Wedding date" required value={e.date} onChange={(v) => edit((d) => void (d.event.date = v))} />
          <TimeField label="Start time" required value={e.time} onChange={(v) => edit((d) => void (d.event.time = v))} />
        </div>
        <Select label="Venue time zone" value={e.utcOffset} options={UTC_OFFSETS.map(([v, l]) => [v, l] as const)} onChange={(v) => edit((d) => void (d.event.utcOffset = v))} />
      </Panel>
      <Panel title="Cover" hint="The first page after the envelope: an arch, two swans and your names.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Title above the date" required max={30} value={c.cover.title} onChange={(v) => edit((d) => void (d.cover.title = v))} />
          <Select
            label="Date style"
            value={c.cover.dateStyle}
            options={[
              ["dots", "10.10.26"],
              ["long", "Saturday, October 10, 2026"],
            ]}
            onChange={(v) => edit((d) => void (d.cover.dateStyle = v))}
          />
        </div>
        <Text label="“Scroll down” hint" max={24} value={c.cover.scrollHint} onChange={(v) => edit((d) => void (d.cover.scrollHint = v))} placeholder="leave empty to hide" />
      </Panel>
    </div>
  );
}

export function EnvelopePanel({ c, edit, lib }: PanelProps) {
  const m = c.music;
  return (
    <div className="space-y-5">
      <Panel title="Envelope" hint="Guests tap the wax seal to open the invitation. Returning guests skip straight to it.">
        <Toggle label="Open with the envelope" checked={c.envelope.enabled} onChange={(v) => edit((d) => void (d.envelope.enabled = v))} hint="Switch off to start on the cover." />
        {c.envelope.enabled && <Text label="Hint under the seal" max={40} value={c.envelope.hint} onChange={(v) => edit((d) => void (d.envelope.hint = v))} />}
      </Panel>
      <Panel title="Background music" hint="Never plays on its own. Guests always get a play/pause button.">
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
            <Toggle label="Start the music when the seal is tapped" checked={m.startOnOpen} onChange={(v) => edit((d) => void (d.music.startOnOpen = v))} hint="The tap counts as permission in every browser. Off: guests press ▶ themselves." />
          </>
        )}
        {m.mode === "file" && <AudioPicker value={m.audio} onChange={(r) => edit((d) => void (d.music.audio = r))} {...lib} />}
      </Panel>
    </div>
  );
}

export function IntroPanel({ c, edit, lib }: PanelProps) {
  const i = c.intro;
  return (
    <Panel title="Invitation" hint="Your invitation words, and up to three photos of the two of you (optional).">
      <Text label="Heading" required multiline max={60} value={i.heading} onChange={(v) => edit((d) => void (d.intro.heading = v))} />
      <Text label="Message" required multiline max={400} value={i.message} onChange={(v) => edit((d) => void (d.intro.message = v))} />
      {i.photos.map((p, idx) => (
        <Item key={p.id} label={`Photo ${idx + 1}`} index={idx} count={i.photos.length} min={0} onMove={(to) => edit((d) => void (d.intro.photos = move(d.intro.photos, idx, to)))} onRemove={() => edit((d) => void d.intro.photos.splice(idx, 1))}>
          <PhotoPicker label="Photo" value={p.image} onChange={(r) => edit((d) => void (d.intro.photos[idx]!.image = r))} {...lib} />
          <Text label="Caption" max={40} value={p.caption} onChange={(v) => edit((d) => void (d.intro.photos[idx]!.caption = v))} />
        </Item>
      ))}
      <AddButton disabled={i.photos.length >= 3} onClick={() => edit((d) => void d.intro.photos.push({ id: newItemId(), image: null, caption: "" }))}>
        + Add a photo
      </AddButton>
      <Tokens />
    </Panel>
  );
}

export function CountdownPanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Countdown" hint="Counts down to your date and start time, every second. Set them under Couple & date.">
      <Text label="Title" required max={40} value={c.countdown.title} onChange={(v) => edit((d) => void (d.countdown.title = v))} />
      <Text label="Message once the wedding has begun" required max={120} value={c.countdown.afterMessage} onChange={(v) => edit((d) => void (d.countdown.afterMessage = v))} />
    </Panel>
  );
}

export function SchedulePanel({ c, edit }: PanelProps) {
  const items = c.schedule.items;
  return (
    <Panel title="Schedule of events" hint="Shown as a timeline with roses at the start and end.">
      <Text label="Title" required max={40} value={c.schedule.title} onChange={(v) => edit((d) => void (d.schedule.title = v))} />
      {items.map((it, idx) => (
        <Item key={it.id} label={`Event ${idx + 1}`} index={idx} count={items.length} min={1} onMove={(to) => edit((d) => void (d.schedule.items = move(d.schedule.items, idx, to)))} onRemove={() => edit((d) => void d.schedule.items.splice(idx, 1))}>
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <TimeField label="Time" value={it.time} onChange={(v) => edit((d) => void (d.schedule.items[idx]!.time = v))} />
            <Text label="What's happening" required max={40} value={it.title} onChange={(v) => edit((d) => void (d.schedule.items[idx]!.title = v))} />
          </div>
          <Text label="Small note (optional)" max={80} value={it.note} onChange={(v) => edit((d) => void (d.schedule.items[idx]!.note = v))} />
        </Item>
      ))}
      <AddButton disabled={items.length >= 12} onClick={() => edit((d) => void d.schedule.items.push({ id: newItemId(), time: "", title: "", note: "" }))}>
        + Add an event
      </AddButton>
    </Panel>
  );
}

export function LocationPanel({ c, edit, lib }: PanelProps) {
  const l = c.location;
  return (
    <Panel title="Venue & map" hint="The “Open in Google Maps” button searches for exactly what you put in “Map search”.">
      <Text label="Title" required max={40} value={l.title} onChange={(v) => edit((d) => void (d.location.title = v))} />
      <Text label="Venue name" required max={80} value={l.venueName} onChange={(v) => edit((d) => void (d.location.venueName = v))} placeholder="e.g. The Rose Court" />
      <Text label="Full address" multiline max={200} value={l.address} onChange={(v) => edit((d) => void (d.location.address = v))} />
      <Text label="Map search (address, place name or “lat,lng”)" max={200} value={l.mapQuery} onChange={(v) => edit((d) => void (d.location.mapQuery = v))} placeholder="Empty = venue name + address" />
      <Toggle label="Show a map on the page" checked={l.showMap} onChange={(v) => edit((d) => void (d.location.showMap = v))} hint="An embedded Google map of the same search. Guests can always use the button." />
      <PhotoPicker label="Venue photo (optional — otherwise an illustration)" value={l.photo} onChange={(r) => edit((d) => void (d.location.photo = r))} {...lib} />
    </Panel>
  );
}

export function DressCodePanel({ c, edit }: PanelProps) {
  const dc = c.dresscode;
  return (
    <Panel title="Dress code" hint="Suggest colours; the illustrated guests wear them.">
      <Text label="Title" required max={40} value={dc.title} onChange={(v) => edit((d) => void (d.dresscode.title = v))} />
      <Text label="Message" multiline max={240} value={dc.message} onChange={(v) => edit((d) => void (d.dresscode.message = v))} />
      {dc.colors.map((col, idx) => (
        <Item key={col.id} label={`Colour ${idx + 1}`} index={idx} count={dc.colors.length} min={0} onMove={(to) => edit((d) => void (d.dresscode.colors = move(d.dresscode.colors, idx, to)))} onRemove={() => edit((d) => void d.dresscode.colors.splice(idx, 1))}>
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <ColorField label="Colour" value={col.hex} onChange={(v) => edit((d) => void (d.dresscode.colors[idx]!.hex = v))} />
            <Text label="Name" max={24} value={col.name} onChange={(v) => edit((d) => void (d.dresscode.colors[idx]!.name = v))} />
          </div>
        </Item>
      ))}
      <AddButton disabled={dc.colors.length >= 6} onClick={() => edit((d) => void d.dresscode.colors.push({ id: newItemId(), hex: "#b76e79", name: "" }))}>
        + Add a colour
      </AddButton>
      <Toggle label="Show the illustrated guests" checked={dc.illustration} onChange={(v) => edit((d) => void (d.dresscode.illustration = v))} />
    </Panel>
  );
}

export function RsvpPanel({ c, edit }: PanelProps) {
  const r = c.rsvp;
  return (
    <Panel title="RSVP" hint="Guests tap the wax seal and reply. Replies appear under Share & settings — only you can see them.">
      <Text label="Title" required max={40} value={r.title} onChange={(v) => edit((d) => void (d.rsvp.title = v))} />
      <Text label="Message" multiline max={200} value={r.message} onChange={(v) => edit((d) => void (d.rsvp.message = v))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Seal text" required max={12} value={r.button} onChange={(v) => edit((d) => void (d.rsvp.button = v))} />
        <DateField label="Reply by (optional)" value={r.deadline} onChange={(v) => edit((d) => void (d.rsvp.deadline = v))} hint="Replies close at the end of this day, or when the wedding starts." />
      </div>
      <Select
        label="Most guests one reply can bring (including themselves)"
        value={String(r.maxGuests)}
        options={Array.from({ length: MAX_PARTY }, (_, i) => [String(i + 1), String(i + 1)] as const)}
        onChange={(v) => edit((d) => void (d.rsvp.maxGuests = Number(v)))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="“Yes” answer" required max={40} value={r.acceptLabel} onChange={(v) => edit((d) => void (d.rsvp.acceptLabel = v))} />
        <Text label="“No” answer" required max={40} value={r.declineLabel} onChange={(v) => edit((d) => void (d.rsvp.declineLabel = v))} />
      </div>
      <Toggle label="Let guests add a message" checked={r.askMessage} onChange={(v) => edit((d) => void (d.rsvp.askMessage = v))} />
      <Text label="Thank-you message" required multiline max={160} value={r.thanks} onChange={(v) => edit((d) => void (d.rsvp.thanks = v))} />
      <Tokens />
    </Panel>
  );
}

export function ClosingPanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Closing" hint="The last page: your words, your names and the date.">
      <Text label="Title" required max={40} value={c.closing.title} onChange={(v) => edit((d) => void (d.closing.title = v))} />
      <Text label="Message" multiline max={300} value={c.closing.message} onChange={(v) => edit((d) => void (d.closing.message = v))} />
      <Toggle label="“Save the date” buttons" checked={c.closing.saveTheDate} onChange={(v) => edit((d) => void (d.closing.saveTheDate = v))} hint="Google Calendar and Apple / Outlook (.ics)." />
      <Tokens />
    </Panel>
  );
}

const COLORS: [Exclude<keyof WeddingTheme, "preset">, string][] = [
  ["burgundy", "Main colour (envelope, names)"],
  ["wine", "Deepest shade"],
  ["rose", "Accent (roses, ampersand)"],
  ["gold", "Gold lines"],
  ["champagne", "Champagne"],
  ["blush", "Page background"],
  ["ivory", "Light panels"],
];

export function ThemePanel({ c, edit }: PanelProps) {
  const t = c.theme;
  return (
    <Panel title="Colours" hint="Pick a palette, then fine-tune any colour. The artwork follows it.">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Palette">
        {(Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]).map((k) => {
          const p = THEME_PRESETS[k];
          const active = t.preset === k;
          return (
            <button key={k} type="button" role="radio" aria-checked={active} onClick={() => edit((d) => void (d.theme = presetTheme(k)))} className={`rounded-xl border-2 p-3 text-left transition ${active ? "border-rose bg-baby/60" : "border-ink/15 hover:border-ink/40"}`}>
              <span className="flex overflow-hidden rounded-lg border border-ink/10">
                {[p.palette.wine, p.palette.burgundy, p.palette.rose, p.palette.gold, p.palette.champagne, p.palette.blush].map((col, i) => (
                  <span key={i} className="h-8 flex-1" style={{ background: col }} />
                ))}
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
  );
}

const SECTION_LABEL: Record<keyof WeddingContent["sections"], string> = {
  couple: "Invitation & photos",
  countdown: "Countdown",
  schedule: "Schedule of events",
  location: "Venue & map",
  dresscode: "Dress code",
  rsvp: "RSVP",
};

export function SectionsPanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Sections" hint="Switch off anything you don't need. The cover and closing page are always shown.">
      {(Object.keys(SECTION_LABEL) as (keyof WeddingContent["sections"])[]).map((k) => (
        <Toggle key={k} label={SECTION_LABEL[k]} checked={c.sections[k]} onChange={(v) => edit((d) => void (d.sections[k] = v))} />
      ))}
    </Panel>
  );
}
