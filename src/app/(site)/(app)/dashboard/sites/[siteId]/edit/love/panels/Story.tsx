"use client";

import { newItemId } from "@/templates/lovestory/schema";
import { PhotoPicker, Text } from "../../fields";
import { AddButton, DateField, Item, move, Panel, Select } from "../controls";
import type { PanelProps } from "../types";

export function TimelinePanel({ c, edit, lib }: PanelProps) {
  const t = c.timeline;
  return (
    <Panel title="9 · Our story timeline" hint="Your milestones, in order. Dates and photos are optional.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" required max={40} value={t.title} onChange={(v) => edit((d) => void (d.timeline.title = v))} />
        <Text label="Subtitle" max={90} value={t.subtitle} onChange={(v) => edit((d) => void (d.timeline.subtitle = v))} />
      </div>
      {t.events.map((e, i) => (
        <Item key={e.id} label={`Milestone ${i + 1}`} index={i} count={t.events.length} min={1} onMove={(to) => edit((d) => void (d.timeline.events = move(d.timeline.events, i, to)))} onRemove={() => edit((d) => void d.timeline.events.splice(i, 1))}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="Title" required max={50} value={e.title} onChange={(v) => edit((d) => void (d.timeline.events[i]!.title = v))} />
            <DateField label="Date" value={e.date} onChange={(v) => edit((d) => void (d.timeline.events[i]!.date = v))} />
          </div>
          <Text label="What happened" multiline max={240} value={e.description} onChange={(v) => edit((d) => void (d.timeline.events[i]!.description = v))} />
          <PhotoPicker label="Photo (optional)" value={e.photo} onChange={(r) => edit((d) => void (d.timeline.events[i]!.photo = r))} {...lib} />
        </Item>
      ))}
      <AddButton disabled={t.events.length >= 12} onClick={() => edit((d) => void d.timeline.events.push({ id: newItemId(), date: "", title: "", description: "", photo: null }))}>
        + Add milestone
      </AddButton>
    </Panel>
  );
}

export function ScrapbookPanel({ c, edit, lib }: PanelProps) {
  const s = c.scrapbook;
  const catOptions = [["", "No category"] as const, ...s.categories.map((k) => [k.id, k.label || "(unnamed)"] as const)];
  return (
    <div className="space-y-5">
      <Panel title="10 · Memories scrapbook" hint="Up to 30 photos with captions, dates and categories they can filter by. Tip: add many at once from the Photos tab.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Title" required max={40} value={s.title} onChange={(v) => edit((d) => void (d.scrapbook.title = v))} />
          <Text label="Subtitle" max={90} value={s.subtitle} onChange={(v) => edit((d) => void (d.scrapbook.subtitle = v))} />
        </div>
        <Text label="Handwritten note card" multiline max={80} value={s.note} onChange={(v) => edit((d) => void (d.scrapbook.note = v))} placeholder="leave empty to hide" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {s.photos.map((p, i) => (
            <li key={p.id}>
              <Item label={`Photo ${i + 1}`} index={i} count={s.photos.length} min={1} onMove={(to) => edit((d) => void (d.scrapbook.photos = move(d.scrapbook.photos, i, to)))} onRemove={() => edit((d) => void d.scrapbook.photos.splice(i, 1))}>
                <PhotoPicker label="Photo" value={p.image} onChange={(r) => edit((d) => void (d.scrapbook.photos[i]!.image = r))} {...lib} />
                <Text label="Caption" max={60} value={p.caption} onChange={(v) => edit((d) => void (d.scrapbook.photos[i]!.caption = v))} />
                <DateField label="Date" value={p.date} onChange={(v) => edit((d) => void (d.scrapbook.photos[i]!.date = v))} />
                <Select label="Category" value={p.category} options={catOptions} onChange={(v) => edit((d) => void (d.scrapbook.photos[i]!.category = v))} />
              </Item>
            </li>
          ))}
        </ul>
        <AddButton disabled={s.photos.length >= 30} onClick={() => edit((d) => void d.scrapbook.photos.push({ id: newItemId(), image: null, caption: "", date: "", category: "" }))}>
          + Add photo
        </AddButton>
      </Panel>
      <Panel title="Scrapbook categories" hint="Filter buttons like “Fun Moments”. Only categories with photos are shown to them.">
        {s.categories.map((k, i) => (
          <div key={k.id} className="flex items-end gap-2">
            <div className="flex-1">
              <Text label={`Category ${i + 1}`} required max={24} value={k.label} onChange={(v) => edit((d) => void (d.scrapbook.categories[i]!.label = v))} />
            </div>
            <button
              type="button"
              className="mb-1 rounded px-2 py-2 text-xs font-bold text-rose"
              onClick={() =>
                edit((d) => {
                  d.scrapbook.categories.splice(i, 1);
                  for (const p of d.scrapbook.photos) if (p.category === k.id) p.category = "";
                })
              }
              aria-label={`Remove category ${i + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <AddButton disabled={s.categories.length >= 6} onClick={() => edit((d) => void d.scrapbook.categories.push({ id: newItemId(), label: "" }))}>
          + Add category
        </AddButton>
      </Panel>
    </div>
  );
}

export function PhotoWallPanel({ c, edit, lib }: PanelProps) {
  const w = c.photowall;
  return (
    <Panel title="14 · Photo wall" hint="Polaroids hanging under fairy lights. Up to 12.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" required max={40} value={w.title} onChange={(v) => edit((d) => void (d.photowall.title = v))} />
        <Text label="Subtitle" max={90} value={w.subtitle} onChange={(v) => edit((d) => void (d.photowall.subtitle = v))} />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {w.photos.map((p, i) => (
          <li key={p.id}>
            <Item label={`Polaroid ${i + 1}`} index={i} count={w.photos.length} min={1} onMove={(to) => edit((d) => void (d.photowall.photos = move(d.photowall.photos, i, to)))} onRemove={() => edit((d) => void d.photowall.photos.splice(i, 1))}>
              <PhotoPicker label="Photo" value={p.image} onChange={(r) => edit((d) => void (d.photowall.photos[i]!.image = r))} {...lib} />
              <Text label="Caption" max={30} value={p.caption} onChange={(v) => edit((d) => void (d.photowall.photos[i]!.caption = v))} />
            </Item>
          </li>
        ))}
      </ul>
      <AddButton disabled={w.photos.length >= 12} onClick={() => edit((d) => void d.photowall.photos.push({ id: newItemId(), image: null, caption: "" }))}>
        + Add polaroid
      </AddButton>
    </Panel>
  );
}
