"use client";

import { useId, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import { newItemId, type LoveContent, type MediaRef } from "@/templates/lovestory/schema";
import { preparePhoto, uploadAsset } from "../../upload";
import { Panel } from "../controls";
import type { PanelProps } from "../types";

type Job = { key: string; name: string; state: "preparing" | "uploading" | "processing" | "done" | "error"; error?: string };
const STATE_LABEL: Record<Job["state"], string> = { preparing: "Preparing…", uploading: "Uploading…", processing: "Optimising…", done: "Done ✓", error: "Failed" };
const STATE_PCT: Record<Job["state"], number> = { preparing: 15, uploading: 55, processing: 85, done: 100, error: 100 };

/** Where each photo is used in the story (for the library tags and safe deletion). */
export function photoUsage(c: LoveContent): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (r: MediaRef, where: string) => {
    if (!r) return;
    const l = out.get(r.assetId) ?? [];
    if (!l.includes(where)) l.push(where);
    out.set(r.assetId, l);
  };
  add(c.welcome.photo, "Welcome");
  add(c.unlock.photo, "Unlock");
  add(c.final.photo, "Final");
  for (const q of c.quiz.questions) {
    if (q.type === "choice") add(q.photo, "Questions");
    if (q.type === "image") for (const o of q.options) add(o.image, "Questions");
  }
  for (const e of c.timeline.events) add(e.photo, "Timeline");
  for (const p of c.scrapbook.photos) add(p.image, "Scrapbook");
  for (const p of c.photowall.photos) add(p.image, "Photo wall");
  return out;
}

/** Removes every reference to an asset from the draft (before deleting the file). */
export function stripAsset(d: LoveContent, id: string) {
  const clear = (r: MediaRef) => (r?.assetId === id ? null : r);
  d.welcome.photo = clear(d.welcome.photo);
  d.unlock.photo = clear(d.unlock.photo);
  d.final.photo = clear(d.final.photo);
  if (d.music.audio?.assetId === id) d.music.audio = null;
  for (const q of d.quiz.questions) {
    if (q.type === "choice") q.photo = clear(q.photo);
    if (q.type === "image") for (const o of q.options) o.image = clear(o.image);
  }
  for (const e of d.timeline.events) e.photo = clear(e.photo);
  for (const p of d.scrapbook.photos) p.image = clear(p.image);
  for (const p of d.photowall.photos) p.image = clear(p.image);
}

/** Puts a photo into the first empty slot of a list, or adds a new item. */
function placeIn(d: LoveContent, where: "scrapbook" | "photowall", assetId: string) {
  if (where === "scrapbook") {
    const empty = d.scrapbook.photos.find((p) => !p.image);
    if (empty) empty.image = { assetId };
    else if (d.scrapbook.photos.length < 30) d.scrapbook.photos.push({ id: newItemId(), image: { assetId }, caption: "", date: "", category: "" });
    else return false;
  } else {
    const empty = d.photowall.photos.find((p) => !p.image);
    if (empty) empty.image = { assetId };
    else if (d.photowall.photos.length < 12) d.photowall.photos.push({ id: newItemId(), image: { assetId }, caption: "" });
    else return false;
  }
  return true;
}

export function PhotosPanel({ c, edit, lib, loaded }: PanelProps & { loaded: boolean }) {
  const inputId = useId();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const photos = lib.library.filter((a) => a.kind === "image");
  const usage = photoUsage(c);
  const uploading = jobs.some((j) => j.state !== "done" && j.state !== "error");
  const unused = photos.filter((p) => !usage.has(p.id));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setMsg(null);
    const list = Array.from(files).slice(0, 30);
    const fresh: Job[] = list.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, state: "preparing" }));
    setJobs((j) => [...fresh, ...j].slice(0, 40));
    const set = (key: string, patch: Partial<Job>) => setJobs((all) => all.map((j) => (j.key === key ? { ...j, ...patch } : j)));
    let ok = 0;
    // One at a time: kinder to mobile data and to the per-site rate limit.
    for (let i = 0; i < list.length; i++) {
      const f = list[i]!;
      const key = fresh[i]!.key;
      try {
        if (f.size > 40 * 1024 * 1024) throw new Error("That file is too large (photos up to 15 MB after conversion).");
        const p = await preparePhoto(f);
        if (p.blob.size > 15 * 1024 * 1024) throw new Error("Photos can be up to 15 MB.");
        await uploadAsset(lib.siteId, "image", p.blob, p.type, p.name, false, (s) => set(key, { state: s }));
        set(key, { state: "done" });
        ok++;
      } catch (e) {
        set(key, { state: "error", error: e instanceof ApiFailure || e instanceof Error ? e.message : "Upload failed." });
      }
    }
    await lib.onUploaded();
    if (ok) setMsg({ tone: "success", text: `${ok} photo${ok === 1 ? "" : "s"} uploaded. Use “+ Scrapbook” / “+ Photo wall”, or pick them in any section.` });
  }

  async function remove(id: string) {
    const used = usage.get(id);
    if (!confirm(used ? `This photo is used in: ${used.join(", ")}. Remove it from the story and delete the file?` : "Delete this photo for good?")) return;
    setBusy(id);
    setMsg(null);
    try {
      // Server refuses (409) if the photo is on the published page; only then is the draft untouched.
      await api(`/api/assets/${id}`, { method: "DELETE" });
      edit((d) => stripAsset(d, id));
      await lib.onUploaded();
      setMsg({ tone: "success", text: "Photo deleted." });
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiFailure ? e.message : "Couldn't delete the photo." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel
      title="Photos"
      hint={
        <>
          Upload once, use anywhere: every photo picker in the studio can choose from here. JPEG, PNG, WebP or iPhone HEIC · resized automatically · location data is removed. Up to 80 photos per story.
        </>
      }
    >
      <div className="rounded-xl border-2 border-dashed border-pink/70 bg-baby/30 p-4 text-center">
        <label htmlFor={inputId} className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-ink px-5 py-2.5 font-bold text-white hover:bg-rose ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? "Uploading…" : "Upload photos"}
        </label>
        <input id={inputId} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="sr-only" disabled={uploading} onChange={(e) => void onFiles(e.target.files).then(() => (e.target.value = ""))} />
        <p className="mt-2 text-xs text-ink-soft">You can select several at once.</p>
      </div>

      {jobs.length > 0 && (
        <ul className="space-y-1.5" aria-label="Uploads">
          {jobs.map((j) => (
            <li key={j.key} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{j.name}</span>
                <span className={`shrink-0 text-xs font-bold ${j.state === "error" ? "text-rose" : j.state === "done" ? "text-emerald-700" : "text-ink-soft"}`}>{STATE_LABEL[j.state]}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={`${j.name} upload`} aria-valuenow={STATE_PCT[j.state]} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all ${j.state === "error" ? "bg-rose" : "bg-pink"}`} style={{ width: `${STATE_PCT[j.state]}%` }} />
              </div>
              {j.error && <p className="mt-1 text-xs text-rose">{j.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-cream px-3 py-2 text-sm">
          <span>
            {unused.length} photo{unused.length === 1 ? "" : "s"} not used yet.
          </span>
          <Button
            variant="secondary"
            className="min-h-9 px-3 py-1 text-sm"
            onClick={() =>
              edit((d) => {
                for (const p of unused) if (!placeIn(d, "scrapbook", p.id)) break;
              })
            }
          >
            Add all to scrapbook
          </Button>
        </div>
      )}

      {!loaded ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loading photos">
          {[0, 1, 2].map((i) => (
            <li key={i} className="aspect-square animate-pulse rounded-xl bg-ink/10" />
          ))}
        </ul>
      ) : photos.length === 0 ? (
        <p className="rounded-lg bg-baby px-3 py-6 text-center text-sm text-ink-soft">No photos yet — upload your favourites ♡</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((a) => {
            const used = usage.get(a.id);
            return (
              <li key={a.id} className="overflow-hidden rounded-xl border-2 border-ink/10 bg-white">
                <div className="aspect-square bg-baby">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {a.thumb && <img src={a.thumb} alt={a.name} className="size-full object-cover" loading="lazy" />}
                </div>
                <div className="space-y-1.5 p-2 text-xs">
                  <p className="truncate font-bold" title={a.name}>
                    {a.name}
                  </p>
                  <p className={used ? "text-emerald-700" : "text-ink-soft"}>{used ? `Used: ${used.join(", ")}` : "Not used yet"}</p>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className="rounded bg-baby px-2 py-1 font-bold hover:bg-blush" onClick={() => edit((d) => void placeIn(d, "scrapbook", a.id))}>
                      + Scrapbook
                    </button>
                    <button type="button" className="rounded bg-baby px-2 py-1 font-bold hover:bg-blush" onClick={() => edit((d) => void placeIn(d, "photowall", a.id))}>
                      + Photo wall
                    </button>
                    <button type="button" className="rounded px-2 py-1 font-bold text-rose hover:bg-baby disabled:opacity-40" disabled={busy !== null} onClick={() => void remove(a.id)} aria-label={`Delete ${a.name}`}>
                      {busy === a.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
