"use client";

import { OCCASIONS, RELATIONSHIPS } from "@/templates/lovestory/schema";
import { AudioPicker, PhotoPicker, Text } from "../../fields";
import { DateField, Panel, Select } from "../controls";
import type { PanelProps } from "../types";

const REL_LABEL: Record<(typeof RELATIONSHIPS)[number], string> = { girlfriend: "Girlfriend", boyfriend: "Boyfriend", partner: "Partner", wife: "Wife", husband: "Husband", fiance: "Fiancé(e)", crush: "Crush ♡" };
const OCC_LABEL: Record<(typeof OCCASIONS)[number], string> = { birthday: "Birthday", anniversary: "Anniversary", valentines: "Valentine's Day", proposal: "Proposal", milestone: "Relationship milestone", "just-because": "Just because" };

export const Tokens = () => (
  <p className="rounded-lg bg-cream px-3 py-2 text-xs text-ink-soft">
    Tip: write <b>{"{partner}"}</b>, <b>{"{me}"}</b>, <b>{"{pet}"}</b> or <b>{"{days}"}</b> (days together) anywhere — they&apos;re filled in automatically.
  </p>
);

export function DetailsPanel({ c, edit }: PanelProps) {
  const p = c.people;
  return (
    <Panel title="Personal details" hint="Who this story is from and for. Names are required before you publish.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Their name" name="partnerName" required max={40} value={p.partnerName} onChange={(v) => edit((d) => void (d.people.partnerName = v))} placeholder="e.g. Aanya" />
        <Text label="Your name" name="creatorName" required max={40} value={p.creatorName} onChange={(v) => edit((d) => void (d.people.creatorName = v))} />
        <Text label="Pet name you call them" max={30} value={p.petName} onChange={(v) => edit((d) => void (d.people.petName = v))} placeholder="used as {pet}" />
        <Select label="They are your…" value={p.relationship} options={RELATIONSHIPS.map((r) => [r, REL_LABEL[r]] as const)} onChange={(v) => edit((d) => void (d.people.relationship = v))} />
        <Select label="Occasion" value={p.occasion} options={OCCASIONS.map((o) => [o, OCC_LABEL[o]] as const)} onChange={(v) => edit((d) => void (d.people.occasion = v))} />
        <DateField label="Together since" value={p.startDate} onChange={(v) => edit((d) => void (d.people.startDate = v))} hint="Powers {days} — the number of days together." />
        <DateField label="First met" value={p.firstMetDate} onChange={(v) => edit((d) => void (d.people.firstMetDate = v))} />
      </div>
      <Tokens />
    </Panel>
  );
}

export function WelcomePanel({ c, edit, lib }: PanelProps) {
  const w = c.welcome;
  const m = c.music;
  return (
    <div className="space-y-5">
      <Panel title="1 · Welcome page" hint="The first thing they see: a night sky, fairy lights and your greeting.">
        <Text label="Greeting" required max={60} value={w.greeting} onChange={(v) => edit((d) => void (d.welcome.greeting = v))} placeholder="Hey {partner}..." />
        <Text label="Introduction" multiline max={300} value={w.intro} onChange={(v) => edit((d) => void (d.welcome.intro = v))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Button" required max={28} value={w.button} onChange={(v) => edit((d) => void (d.welcome.button = v))} />
          <Text label="Pinned note" multiline max={80} value={w.note} onChange={(v) => edit((d) => void (d.welcome.note = v))} placeholder="leave empty to hide" />
        </div>
        <PhotoPicker label="Optional polaroid on the welcome page" value={w.photo} onChange={(r) => edit((d) => void (d.welcome.photo = r))} {...lib} />
        <Tokens />
      </Panel>
      <Panel title="Background music" hint="Music never plays by itself — it starts only when they tap Play or the welcome button.">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Song title" max={60} value={m.title} onChange={(v) => edit((d) => void (d.music.title = v))} />
            <Text label="Artist / line under it" max={60} value={m.artist} onChange={(v) => edit((d) => void (d.music.artist = v))} />
          </div>
        )}
        {m.mode === "file" && <AudioPicker value={m.audio} onChange={(r) => edit((d) => void (d.music.audio = r))} {...lib} />}
      </Panel>
    </div>
  );
}
