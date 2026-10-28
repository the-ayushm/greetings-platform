"use client";

import { useId, useRef, type ReactNode } from "react";
import { ListControls } from "../fields";

/** Small form controls for the love story studio (Tailwind, matching the store/editor UI). */

export function move<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x!);
  return a;
}

export function Panel({ title, hint, children, actions }: { title: string; hint?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-ink/15 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {actions}
      </div>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** One editable list item with move/remove controls. */
export function Item({ label, index, count, min, onMove, onRemove, children, badge }: { label: string; index: number; count: number; min: number; onMove: (to: number) => void; onRemove: () => void; children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl bg-baby/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          {label} {badge}
        </p>
        <ListControls index={index} count={count} min={min} label={label.toLowerCase()} onMove={onMove} onRemove={onRemove} />
      </div>
      {children}
    </div>
  );
}

export function AddButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-dashed border-rose/60 px-4 py-2 text-sm font-bold text-rose hover:bg-baby disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-2 transition ${checked ? "border-rose bg-rose" : "border-ink/25 bg-ink/10"}`}
      >
        <span aria-hidden="true" className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
        <span className="sr-only">{label}</span>
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-bold">{label}</span>
        {hint && <span className="block text-ink-soft">{hint}</span>}
      </label>
    </div>
  );
}

export function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="mt-1 block w-full rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateField({ label, value, onChange, required, hint }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
        {required && <span className="text-rose"> *</span>}
      </label>
      <div className="mt-1 flex gap-2">
        <input id={id} type="date" min="1900-01-01" max="2200-12-31" value={value} onChange={(e) => onChange(e.target.value)} className="block w-full min-w-0 rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose" />
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

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value.toLowerCase())} className="size-11 shrink-0 cursor-pointer rounded-lg border-2 border-ink/20 bg-white p-0.5" />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-bold">
          {label}
        </label>
        <input
          aria-label={`${label} hex value`}
          // Uncontrolled so partial input ("#c2") can be typed; re-keyed when the picker changes it.
          key={value}
          defaultValue={value}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value.toLowerCase())}
          className="mt-0.5 w-24 rounded border border-ink/20 px-1.5 py-0.5 font-mono text-xs"
        />
      </div>
    </div>
  );
}

/**
 * Textarea with a tiny formatting toolbar: **bold**, *italic*, "- " bullets. The recipient page
 * turns these markers into styled text — no HTML is ever stored or rendered.
 */
export function RichTextField({ label, value, onChange, max, required }: { label: string; value: string; onChange: (v: string) => void; max: number; required?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const wrap = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || "text";
    const next = value.slice(0, a) + marker + sel + marker + value.slice(b);
    if (next.length > max) return;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + marker.length, a + marker.length + sel.length);
    });
  };
  const bullets = () => {
    const el = ref.current;
    if (!el) return;
    const a = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const endIdx = value.indexOf("\n", el.selectionEnd);
    const b = endIdx < 0 ? value.length : endIdx;
    const block = value.slice(a, b).split("\n").map((l) => (l.startsWith("- ") ? l.slice(2) : `- ${l}`)).join("\n");
    const next = value.slice(0, a) + block + value.slice(b);
    if (next.length <= max) onChange(next);
  };
  const tool = "rounded-md border-2 border-ink/15 bg-white px-2.5 py-1 text-sm hover:bg-baby";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
          {required && <span className="text-rose"> *</span>}
        </label>
        <span className={value.length > max * 0.9 ? "text-sm text-rose" : "text-sm text-ink-soft"} aria-hidden="true">
          {value.length}/{max}
        </span>
      </div>
      <div className="mt-1 flex gap-1.5" role="toolbar" aria-label="Formatting">
        <button type="button" className={`${tool} font-extrabold`} onClick={() => wrap("**")} aria-label="Bold">
          B
        </button>
        <button type="button" className={`${tool} italic`} onClick={() => wrap("*")} aria-label="Italic">
          I
        </button>
        <button type="button" className={tool} onClick={bullets} aria-label="Bullet list">
          • list
        </button>
      </div>
      <textarea ref={ref} id={id} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} dir="auto" className="mt-1.5 block min-h-40 w-full rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose" />
      <p className="mt-1 text-xs text-ink-soft">
        Leave an empty line for a new paragraph. <b>**bold**</b>, <i>*italic*</i>, and lines starting with &quot;- &quot; become a list with little hearts.
      </p>
    </div>
  );
}
