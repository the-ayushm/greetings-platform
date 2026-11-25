"use client";

import { useId } from "react";
import { MAX_EVENTS, MAX_PARTY, MAX_PHOTOS, newItemId, waNumber, type VivahContent } from "@/templates/vivah/schema";
import type { LibraryAsset } from "../upload";
import { AudioPicker, PhotoPicker, Text } from "../fields";
import { AddButton, DateField, Item, move, Panel, Select, Toggle } from "../love/controls";

/** Panels of the Shiv–Parvati invitation studio. Every field writes straight into the draft. */

export type Edit = (fn: (d: VivahContent) => void) => void;
export type Lib = { siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> };
export type PanelProps = { c: VivahContent; edit: Edit; lib: Lib };

function TimeField({ label, value, onChange, required, hint }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required && <span className="text-rose"> *</span>}
      </label>
      <div className="mt-1 flex gap-2">
        <input id={id} type="time" value={value} onChange={(e) => onChange(e.target.value)} className="block w-full min-w-0 rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose" />
        {value && !required && (
          <button type="button" className="rounded-lg px-2 text-sm font-bold text-rose underline" onClick={() => onChange("")} aria-label={`Clear ${label}`}>
            Clear
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function PersonFields({ who, c, edit }: { who: "groom" | "bride"; c: VivahContent; edit: Edit }) {
  const p = c.couple[who];
  const groom = who === "groom";
  return (
    <div className="space-y-4 rounded-xl bg-baby/50 p-3">
      <p className="text-sm font-extrabold">{groom ? "Groom (dulha)" : "Bride (dulhan)"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="First name" required max={30} value={p.first} onChange={(v) => edit((d) => void (d.couple[who].first = v))} placeholder={groom ? "e.g. Rudra" : "e.g. Gauri"} />
        <Text label="Full name" max={60} value={p.full} onChange={(v) => edit((d) => void (d.couple[who].full = v))} placeholder={groom ? "e.g. Rudra Mishra" : "e.g. Gauri Pandey"} />
      </div>
      <Text
        label="Parents' line"
        max={120}
        value={p.parents}
        onChange={(v) => edit((d) => void (d.couple[who].parents = v))}
        placeholder={groom ? "Son of Mrs. Kavita & Mr. Alok Mishra" : "Daughter of Mrs. Rekha & Mr. Sanjay Pandey"}
      />
    </div>
  );
}

export function CouplePanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Couple & families" hint="Your names appear on the opening screen, the Kailash scene, the families page and the closing. Required before you publish.">
      <PersonFields who="groom" c={c} edit={edit} />
      <PersonFields who="bride" c={c} edit={edit} />
      <Select
        label="Whose name comes first?"
        value={c.couple.lead}
        options={[
          ["groom", "Groom first (e.g. Rudra & Gauri)"],
          ["bride", "Bride first (e.g. Gauri & Rudra)"],
        ]}
        onChange={(v) => edit((d) => void (d.couple.lead = v))}
      />
      <Text label="Hosts (families inviting)" max={80} value={c.blessing.hosts} onChange={(v) => edit((d) => void (d.blessing.hosts = v))} placeholder="e.g. The Mishra & Pandey families" />
      <Text label="Invitation message" required multiline max={300} value={c.blessing.message} onChange={(v) => edit((d) => void (d.blessing.message = v))} />
    </Panel>
  );
}

export function DatePanel({ c, edit }: PanelProps) {
  const w = c.wedding;
  return (
    <Panel title="Wedding date & city" hint="Powers the hero, the scratch-to-reveal card and the live countdown. Times are Indian Standard Time.">
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField label="Wedding date" required value={w.date} onChange={(v) => edit((d) => void (d.wedding.date = v))} />
        <TimeField label="Muhurat / start time" required value={w.time} onChange={(v) => edit((d) => void (d.wedding.time = v))} />
      </div>
      <Text label="City" required max={60} value={w.city} onChange={(v) => edit((d) => void (d.wedding.city = v))} placeholder="e.g. Varanasi, Uttar Pradesh" />
      <Text label="Wedding hashtag (optional)" max={40} value={w.hashtag} onChange={(v) => edit((d) => void (d.wedding.hashtag = v))} placeholder="e.g. #RudraKiGauri" />
    </Panel>
  );
}

export function EventsPanel({ c, edit }: PanelProps) {
  const items = c.events;
  return (
    <Panel title="Functions" hint="Haldi, Mehendi, Sangeet, Phere, Reception… Each gets its own card with Directions (Google Maps) and Save-date (Google Calendar) buttons.">
      {items.map((e, idx) => (
        <Item key={e.id} label={e.name || `Function ${idx + 1}`} index={idx} count={items.length} min={1} onMove={(to) => edit((d) => void (d.events = move(d.events, idx, to)))} onRemove={() => edit((d) => void d.events.splice(idx, 1))}>
          <Text label="Name" required max={30} value={e.name} onChange={(v) => edit((d) => void (d.events[idx]!.name = v))} placeholder="e.g. Haldi" />
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label="Date" required value={e.date} onChange={(v) => edit((d) => void (d.events[idx]!.date = v))} />
            <TimeField label="Time" value={e.time} onChange={(v) => edit((d) => void (d.events[idx]!.time = v))} hint="Clear it to show only the date." />
          </div>
          <Text label="Venue" required max={80} value={e.venue} onChange={(v) => edit((d) => void (d.events[idx]!.venue = v))} placeholder="e.g. Kashi Vivah Mandap" />
          <Text label="Address" max={200} value={e.address} onChange={(v) => edit((d) => void (d.events[idx]!.address = v))} placeholder="Street, area, city, PIN — Directions searches for venue + address" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="Small note" max={100} value={e.note} onChange={(v) => edit((d) => void (d.events[idx]!.note = v))} />
            <Text label="Dress code" max={40} value={e.dress} onChange={(v) => edit((d) => void (d.events[idx]!.dress = v))} placeholder="e.g. Yellows" />
          </div>
        </Item>
      ))}
      <AddButton disabled={items.length >= MAX_EVENTS} onClick={() => edit((d) => void d.events.push({ id: newItemId(), name: "", date: d.wedding.date, time: "", venue: "", address: "", note: "", dress: "" }))}>
        + Add a function
      </AddButton>
    </Panel>
  );
}

export function PhotosPanel({ c, edit, lib }: PanelProps) {
  const pics = c.gallery;
  return (
    <Panel title="Photos" hint={`Your pre-wedding photos as tilted polaroids, with a full-screen viewer. Up to ${MAX_PHOTOS}; portrait (4:5) photos look best. No photos = the section is hidden.`}>
      {pics.map((p, idx) => (
        <Item key={p.id} label={`Photo ${idx + 1}`} index={idx} count={pics.length} min={0} onMove={(to) => edit((d) => void (d.gallery = move(d.gallery, idx, to)))} onRemove={() => edit((d) => void d.gallery.splice(idx, 1))}>
          <PhotoPicker label="Photo" value={p.image} onChange={(r) => edit((d) => void (d.gallery[idx]!.image = r))} {...lib} />
        </Item>
      ))}
      <AddButton disabled={pics.length >= MAX_PHOTOS} onClick={() => edit((d) => void d.gallery.push({ id: newItemId(), image: null }))}>
        + Add a photo
      </AddButton>
    </Panel>
  );
}

export function RsvpPanel({ c, edit }: PanelProps) {
  const r = c.rsvp;
  const normalised = waNumber(r.phone);
  return (
    <Panel title="RSVP on WhatsApp" hint="Guests pick the functions they'll attend and how many are coming, then one tap sends you a ready-written WhatsApp message.">
      <div>
        <Text label="Your WhatsApp number" required={c.sections.rsvp} max={24} value={r.phone} onChange={(v) => edit((d) => void (d.rsvp.phone = v))} placeholder="e.g. 98765 43210" />
        <p className={`mt-1 text-xs ${r.phone && !normalised ? "text-rose" : "text-ink-soft"}`}>
          {!r.phone
            ? "Indian numbers: just the 10 digits. Other countries: include the country code."
            : normalised
              ? `Replies will open WhatsApp to +${normalised}.`
              : "That doesn't look like a phone number yet."}
        </p>
      </div>
      <DateField label="Reply by (optional)" value={r.by} onChange={(v) => edit((d) => void (d.rsvp.by = v))} hint="Shown as “Kindly reply by …”." />
      <Select
        label="Most guests one reply can bring"
        value={String(r.maxGuests)}
        options={Array.from({ length: MAX_PARTY }, (_, i) => [String(i + 1), String(i + 1)] as const)}
        onChange={(v) => edit((d) => void (d.rsvp.maxGuests = Number(v)))}
      />
      <Text label="RSVP title" max={40} value={c.words.rsvpTitle} onChange={(v) => edit((d) => void (d.words.rsvpTitle = v))} />
      <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink-soft">In the preview and the demo, “Send RSVP” shows a notice instead of opening WhatsApp. On your published invitation it opens WhatsApp for real.</p>
    </Panel>
  );
}

export function MusicPanel({ c, edit, lib }: PanelProps) {
  const m = c.music;
  return (
    <Panel title="Music" hint="Starts when a guest taps to open the invitation (that tap counts as permission in every browser). There's always a pause button.">
      <Select
        label="Song"
        value={m.mode}
        options={[
          ["default", "Piya Ghar Aavenge (default)"],
          ["file", "Upload our own song"],
          ["none", "No music"],
        ]}
        onChange={(v) => edit((d) => void (d.music.mode = v))}
      />
      {m.mode === "file" && (
        <AudioPicker
          value={m.audio}
          onChange={(r) =>
            edit((d) => {
              d.music.audio = r;
              if (!r) d.music.mode = "default";
            })
          }
          {...lib}
        />
      )}
    </Panel>
  );
}

export function WordsPanel({ c, edit }: PanelProps) {
  const b = c.blessing;
  return (
    <Panel title="Words & blessing" hint="Everything here already has beautiful default wording — change only what you like.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Opening line 1" max={40} value={c.opening.line1} onChange={(v) => edit((d) => void (d.opening.line1 = v))} />
        <Text label="Opening line 2" max={40} value={c.opening.line2} onChange={(v) => edit((d) => void (d.opening.line2 = v))} />
      </div>
      <Text label="Mantra / invocation (shown at the top of the Kailash scene)" multiline max={200} value={b.invocation} onChange={(v) => edit((d) => void (d.blessing.invocation = v))} />
      <Text label="Its meaning" max={80} value={b.invocationMeaning} onChange={(v) => edit((d) => void (d.blessing.invocationMeaning = v))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Countdown title" max={40} value={c.words.countdownTitle} onChange={(v) => edit((d) => void (d.words.countdownTitle = v))} />
        <Text label="Functions title" max={40} value={c.words.eventsTitle} onChange={(v) => edit((d) => void (d.words.eventsTitle = v))} />
        <Text label="Photos title" max={40} value={c.words.momentsTitle} onChange={(v) => edit((d) => void (d.words.momentsTitle = v))} />
      </div>
      <Text label="Closing blessing" multiline max={200} value={c.words.closing} onChange={(v) => edit((d) => void (d.words.closing = v))} />
    </Panel>
  );
}

const SECTION_LABEL: Record<keyof VivahContent["sections"], [string, string]> = {
  families: ["Families page", "Om, hosts, your message and both families."],
  scratch: ["Scratch-to-reveal date", "A gold-foil card guests scratch to reveal your date, with a flower burst."],
  countdown: ["Countdown", "Days, hours, minutes and seconds to the muhurat."],
  events: ["Functions", "One card per function, with Directions and Save-date."],
  gallery: ["Photos", "Shown only when you've added photos."],
  rsvp: ["RSVP on WhatsApp", "Needs your WhatsApp number."],
};

export function SectionsPanel({ c, edit }: PanelProps) {
  return (
    <Panel title="Sections" hint="Switch off anything you don't need. The opening screen, the Kailash scene and the closing page are always shown.">
      {(Object.keys(SECTION_LABEL) as (keyof VivahContent["sections"])[]).map((k) => (
        <Toggle key={k} label={SECTION_LABEL[k][0]} hint={SECTION_LABEL[k][1]} checked={c.sections[k]} onChange={(v) => edit((d) => void (d.sections[k] = v))} />
      ))}
    </Panel>
  );
}
