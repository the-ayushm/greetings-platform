"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { ApiFailure } from "@/lib/api-client";
import { AUDIO_MAX_BYTES, AUDIO_MAX_SECONDS, audioDuration, audioType, preparePhoto, uploadAsset, type LibraryAsset } from "./upload";

export function Section({ id, title, hint, children, open }: { id: string; title: string; hint?: string; children: ReactNode; open?: boolean }) {
  return (
    <details id={id} open={open} className="group rounded-2xl border-2 border-ink/15 bg-white open:border-ink/40">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-extrabold">
        <span>{title}</span>
        <span aria-hidden="true" className="text-pink transition group-open:rotate-90">
          ▸
        </span>
      </summary>
      <div className="space-y-4 border-t-2 border-ink/10 px-4 py-4">
        {hint && <p className="text-sm text-ink-soft">{hint}</p>}
        {children}
      </div>
    </details>
  );
}

export function Text({ label, value, onChange, max, required, multiline, placeholder, name }: { label: string; value: string; onChange: (v: string) => void; max: number; required?: boolean; multiline?: boolean; placeholder?: string; name?: string }) {
  const id = useId();
  const cls = "mt-1 block w-full rounded-lg border-2 border-ink/25 bg-white px-3 py-2 focus:border-rose";
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-bold">
        <span>
          {label}
          {required && <span className="text-rose"> *</span>}
        </span>
        <span className={value.length > max * 0.9 ? "text-rose" : "font-normal text-ink-soft"} aria-hidden="true">
          {value.length}/{max}
        </span>
      </label>
      {multiline ? (
        <textarea id={id} name={name} className={`${cls} min-h-28`} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} dir="auto" />
      ) : (
        <input id={id} name={name} className={cls} value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} dir="auto" />
      )}
    </div>
  );
}

export function ListControls({ index, count, min, onMove, onRemove, label }: { index: number; count: number; min: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex gap-1 text-xs font-bold">
      <button type="button" className="rounded px-2 py-1 hover:bg-baby disabled:opacity-30" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
        ↑
      </button>
      <button type="button" className="rounded px-2 py-1 hover:bg-baby disabled:opacity-30" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}>
        ↓
      </button>
      <button type="button" className="rounded px-2 py-1 text-rose hover:bg-baby disabled:opacity-30" disabled={count <= min} onClick={onRemove} aria-label={`Remove ${label}`}>
        Remove
      </button>
    </div>
  );
}

type Ref = { assetId: string } | null;

export function PhotoPicker({ label, value, onChange, siteId, library, onUploaded }: { label: string; value: Ref; onChange: (r: Ref) => void; siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const id = useId();
  const current = value ? library.find((a) => a.id === value.assetId) : null;
  const photos = library.filter((a) => a.kind === "image");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const p = await preparePhoto(file);
      const assetId = await uploadAsset(siteId, "image", p.blob, p.type, p.name);
      await onUploaded();
      onChange({ assetId });
    } catch (e) {
      setError(e instanceof ApiFailure || e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-pink/70 p-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-baby">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {current?.thumb ? <img src={current.thumb} alt="" className="size-full object-cover" /> : <span className="text-xs text-ink-soft">{value ? "…" : "none"}</span>}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <label htmlFor={id} className={`cursor-pointer rounded-lg bg-ink px-3 py-2 font-bold text-white hover:bg-rose ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? "Uploading…" : value ? "Replace" : "Upload photo"}
          </label>
          <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="sr-only" disabled={busy} onChange={(e) => void onFile(e.target.files?.[0]).then(() => (e.target.value = ""))} />
          {photos.length > 0 && (
            <button type="button" className="rounded-lg px-3 py-2 font-bold underline" onClick={() => setChoosing((v) => !v)}>
              Choose uploaded
            </button>
          )}
          {value && (
            <button type="button" className="rounded-lg px-3 py-2 font-bold text-rose underline" onClick={() => onChange(null)}>
              Clear
            </button>
          )}
        </div>
      </div>
      {choosing && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`block aspect-square w-full overflow-hidden rounded-md border-2 ${value?.assetId === a.id ? "border-rose" : "border-transparent"}`}
                onClick={() => {
                  onChange({ assetId: a.id });
                  setChoosing(false);
                }}
                aria-label={`Use ${a.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {a.thumb && <img src={a.thumb} alt="" className="size-full object-cover" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose">
          {error}
        </p>
      )}
    </div>
  );
}

export function AudioPicker({ value, onChange, siteId, library, onUploaded }: { value: Ref; onChange: (r: Ref) => void; siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rights, setRights] = useState(false);
  const id = useId();
  const current = value ? library.find((a) => a.id === value.assetId) : null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!rights) return setError("Please tick the box to confirm you can use this song.");
    if (file.size > AUDIO_MAX_BYTES) return setError("Songs can be up to 12 MB.");
    const d = await audioDuration(file);
    if (d && d > AUDIO_MAX_SECONDS) return setError("Songs can be up to 8 minutes long.");
    setBusy(true);
    try {
      const assetId = await uploadAsset(siteId, "audio", file, audioType(file), file.name, true);
      await onUploaded();
      onChange({ assetId });
    } catch (e) {
      setError(e instanceof ApiFailure || e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-pink/70 p-3">
      <p className="text-sm font-bold">Song file</p>
      {current ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm">
            ♪ {current.name}
            {current.duration ? ` · ${Math.floor(current.duration / 60)}:${String(Math.round(current.duration % 60)).padStart(2, "0")}` : ""}
          </p>
          {current.src && <audio controls preload="none" src={current.src} className="w-full" />}
        </div>
      ) : (
        <p className="mt-1 text-sm text-ink-soft">{value ? "Loading…" : "No song uploaded — the built-in music box will play."}</p>
      )}
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1 size-4 accent-rose" />
        <span>I own this recording or have permission to share it privately on this page.</span>
      </label>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <label htmlFor={id} className={`cursor-pointer rounded-lg bg-ink px-3 py-2 font-bold text-white hover:bg-rose ${busy || !rights ? "pointer-events-none opacity-60" : ""}`} aria-disabled={busy || !rights}>
          {busy ? "Uploading…" : value ? "Replace song" : "Upload song"}
        </label>
        <input id={id} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,.mp3,.m4a,.aac" className="sr-only" disabled={busy || !rights} onChange={(e) => void onFile(e.target.files?.[0]).then(() => (e.target.value = ""))} />
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            Use music box instead
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-soft">MP3, M4A or AAC · up to 12 MB · up to 8 minutes.</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
