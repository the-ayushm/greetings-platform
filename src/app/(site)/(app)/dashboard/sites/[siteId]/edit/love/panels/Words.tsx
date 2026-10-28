"use client";

import { COUPON_ICON_LABELS } from "@/templates/lovestory/art";
import { COUPON_COLORS, COUPON_ICONS, FINAL_HEARTS, newItemId } from "@/templates/lovestory/schema";
import { PhotoPicker, Text } from "../../fields";
import { AddButton, DateField, Item, move, Panel, RichTextField, Select, Toggle } from "../controls";
import type { PanelProps } from "../types";
import { Tokens } from "./Details";

export function UnlockPanel({ c, edit, lib }: PanelProps) {
  const u = c.unlock;
  return (
    <Panel title="8 · Unlocking page" hint="Shown after the questions: an envelope opens into your story.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" required max={40} value={u.title} onChange={(v) => edit((d) => void (d.unlock.title = v))} />
        <Text label="Button" required max={28} value={u.button} onChange={(v) => edit((d) => void (d.unlock.button = v))} />
      </div>
      <Text label="Message" multiline max={200} value={u.message} onChange={(v) => edit((d) => void (d.unlock.message = v))} />
      <PhotoPicker label="Optional polaroid" value={u.photo} onChange={(r) => edit((d) => void (d.unlock.photo = r))} {...lib} />
    </Panel>
  );
}

export function CalendarPanel({ c, edit }: PanelProps) {
  const k = c.calendar;
  return (
    <Panel title="11 · Special dates" hint="Each date gets a heart on the calendar. Yearly dates (birthdays, anniversaries) repeat every year, and the calendar opens on the next one coming up.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" required max={40} value={k.title} onChange={(v) => edit((d) => void (d.calendar.title = v))} />
        <Text label="List title" max={40} value={k.listTitle} onChange={(v) => edit((d) => void (d.calendar.listTitle = v))} />
      </div>
      {k.dates.map((x, i) => (
        <Item key={x.id} label={`Date ${i + 1}`} index={i} count={k.dates.length} min={1} onMove={(to) => edit((d) => void (d.calendar.dates = move(d.calendar.dates, i, to)))} onRemove={() => edit((d) => void d.calendar.dates.splice(i, 1))}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="What is it?" required max={40} value={x.label} onChange={(v) => edit((d) => void (d.calendar.dates[i]!.label = v))} />
            <DateField label="Date" required value={x.date} onChange={(v) => edit((d) => void (d.calendar.dates[i]!.date = v))} />
          </div>
          <Toggle label="Repeats every year" checked={x.repeatsYearly} onChange={(v) => edit((d) => void (d.calendar.dates[i]!.repeatsYearly = v))} />
        </Item>
      ))}
      <AddButton disabled={k.dates.length >= 20} onClick={() => edit((d) => void d.calendar.dates.push({ id: newItemId(), date: "", label: "", repeatsYearly: true }))}>
        + Add date
      </AddButton>
    </Panel>
  );
}

export function LetterPanel({ c, edit }: PanelProps) {
  const L = c.letter;
  return (
    <Panel title="12 · Love letter" hint="A letter with tabs they can flip between — Open Letter, Reasons I Love You, Promises… rename, add or remove them.">
      <Text label="Letter heading" required max={60} value={L.heading} onChange={(v) => edit((d) => void (d.letter.heading = v))} />
      {L.tabs.map((t, i) => (
        <Item key={t.id} label={`Tab ${i + 1}`} index={i} count={L.tabs.length} min={1} onMove={(to) => edit((d) => void (d.letter.tabs = move(d.letter.tabs, i, to)))} onRemove={() => edit((d) => void d.letter.tabs.splice(i, 1))}>
          <Text label="Tab name" required max={24} value={t.label} onChange={(v) => edit((d) => void (d.letter.tabs[i]!.label = v))} />
          <RichTextField label="Words" required max={2500} value={t.body} onChange={(v) => edit((d) => void (d.letter.tabs[i]!.body = v))} />
        </Item>
      ))}
      <AddButton disabled={L.tabs.length >= 8} onClick={() => edit((d) => void d.letter.tabs.push({ id: newItemId(), label: "", body: "" }))}>
        + Add tab
      </AddButton>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Sign-off" max={40} value={L.signoff} onChange={(v) => edit((d) => void (d.letter.signoff = v))} />
        <Text label="Signature" max={40} value={L.signature} onChange={(v) => edit((d) => void (d.letter.signature = v))} placeholder="{me}" />
      </div>
      <Tokens />
    </Panel>
  );
}

const COLOR_LABEL: Record<(typeof COUPON_COLORS)[number], string> = { pink: "Pink", peach: "Peach", sky: "Sky blue", lilac: "Lilac", mint: "Mint", butter: "Butter yellow" };

export function CouponsPanel({ c, edit }: PanelProps) {
  const k = c.coupons;
  return (
    <Panel title="13 · Love coupons" hint="Little promises they can tap to redeem. Redeemed coupons stay stamped on their phone (and you're told, if responses are on).">
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Title" required max={40} value={k.title} onChange={(v) => edit((d) => void (d.coupons.title = v))} />
        <Text label="Subtitle" max={90} value={k.subtitle} onChange={(v) => edit((d) => void (d.coupons.subtitle = v))} />
      </div>
      {k.items.map((it, i) => (
        <Item key={it.id} label={`Coupon ${i + 1}`} index={i} count={k.items.length} min={1} onMove={(to) => edit((d) => void (d.coupons.items = move(d.coupons.items, i, to)))} onRemove={() => edit((d) => void d.coupons.items.splice(i, 1))}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="Good for…" required max={32} value={it.title} onChange={(v) => edit((d) => void (d.coupons.items[i]!.title = v))} />
            <Text label="Short description" max={120} value={it.description} onChange={(v) => edit((d) => void (d.coupons.items[i]!.description = v))} />
          </div>
          <Text label="How to redeem" multiline max={160} value={it.redeem} onChange={(v) => edit((d) => void (d.coupons.items[i]!.redeem = v))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Colour" value={it.color} options={COUPON_COLORS.map((x) => [x, COLOR_LABEL[x]] as const)} onChange={(v) => edit((d) => void (d.coupons.items[i]!.color = v))} />
            <Select label="Icon" value={it.icon} options={COUPON_ICONS.map((x) => [x, COUPON_ICON_LABELS[x]] as const)} onChange={(v) => edit((d) => void (d.coupons.items[i]!.icon = v))} />
          </div>
        </Item>
      ))}
      <AddButton disabled={k.items.length >= 12} onClick={() => edit((d) => void d.coupons.items.push({ id: newItemId(), title: "", description: "", redeem: "", color: "pink", icon: "star" }))}>
        + Add coupon
      </AddButton>
      <div className="grid gap-4 sm:grid-cols-3">
        <Text label="Redeem button" required max={24} value={k.redeemButton} onChange={(v) => edit((d) => void (d.coupons.redeemButton = v))} />
        <Text label="Redeemed stamp" required max={20} value={k.redeemedLabel} onChange={(v) => edit((d) => void (d.coupons.redeemedLabel = v))} />
        <Text label="Continue button" required max={40} value={k.footer} onChange={(v) => edit((d) => void (d.coupons.footer = v))} />
      </div>
    </Panel>
  );
}

export function FinalPanel({ c, edit, lib }: PanelProps) {
  const f = c.final;
  return (
    <Panel title="15 · Final surprise" hint="The ending: a glowing heart, your last words and one big button.">
      <Text label="Headline" required max={60} value={f.title} onChange={(v) => edit((d) => void (d.final.title = v))} />
      <Text label="Message" multiline max={300} value={f.message} onChange={(v) => edit((d) => void (d.final.message = v))} />
      <p className="text-sm font-bold">Little thank-you tags</p>
      {f.notes.map((n, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1">
            <Text label={`Tag ${i + 1}`} required max={50} value={n} onChange={(v) => edit((d) => void (d.final.notes[i] = v))} />
          </div>
          <button type="button" className="mb-1 rounded px-2 py-2 text-xs font-bold text-rose" onClick={() => edit((d) => void d.final.notes.splice(i, 1))} aria-label={`Remove tag ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <AddButton disabled={f.notes.length >= 6} onClick={() => edit((d) => void d.final.notes.push(""))}>
        + Add tag
      </AddButton>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Signature" max={40} value={f.signature} onChange={(v) => edit((d) => void (d.final.signature = v))} />
        <Text label="Big button" required max={36} value={f.button} onChange={(v) => edit((d) => void (d.final.button = v))} />
      </div>
      <Text label="Shown after they tap the button" multiline max={200} value={f.afterMessage} onChange={(v) => edit((d) => void (d.final.afterMessage = v))} />
      <Select
        label="Heart animation"
        value={f.heart}
        options={FINAL_HEARTS.map((h) => [h, { glow: "Soft glow", pulse: "Heartbeat", burst: "Floating, bursts on tap" }[h]] as const)}
        onChange={(v) => edit((d) => void (d.final.heart = v))}
      />
      <PhotoPicker label="Photo inside the heart (optional)" value={f.photo} onChange={(r) => edit((d) => void (d.final.photo = r))} {...lib} />
      <Tokens />
    </Panel>
  );
}
