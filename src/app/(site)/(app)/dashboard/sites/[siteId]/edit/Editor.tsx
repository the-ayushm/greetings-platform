"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { api, ApiFailure } from "@/lib/api-client";
import { THEME_PRESETS, type ScrapbookContent } from "@/templates/scrapbook/schema";
import { AudioPicker, ListControls, PhotoPicker, Section, Text } from "./fields";
import type { LibraryAsset } from "./upload";

type SaveState = "saved" | "unsaved" | "saving" | "error" | "conflict" | "offline";
type Issue = { path: string; message: string };

const LABELS: Record<string, string> = {
  recipientName: "Their name",
  senderName: "Your name",
  "cover.button": "Cover button text",
  startButton: "Start button text",
  "copy.back": "Back button text",
};
const describe = (path: string) =>
  LABELS[path] ??
  path
    .replace(/\.(\d+)/g, (_, n) => ` #${Number(n) + 1}`)
    .replace(/\./g, " › ")
    .replace(/([A-Z])/g, " $1")
    .toLowerCase();

function move<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x!);
  return a;
}

export function Editor({ siteId, initial, initialRevision, status, publishedUrl }: { siteId: string; initial: ScrapbookContent; initialRevision: number; status: string; publishedUrl: string | null }) {
  const [c, setC] = useState(initial);
  const [save, setSave] = useState<SaveState>("saved");
  const [library, setLibrary] = useState<LibraryAsset[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<string | null>(status === "published" ? publishedUrl : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const revision = useRef(initialRevision);
  const latest = useRef(initial);
  const dirty = useRef(false);
  const inflight = useRef<Promise<void> | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  // Autosave triggers on real changes only (compared with what the server last accepted).
  const savedJson = useRef(JSON.stringify(initial));

  const edit = useCallback((fn: (d: ScrapbookContent) => void) => {
    setC((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const r = await api<{ assets: LibraryAsset[] }>(`/api/sites/${siteId}/assets`);
      setLibrary(r.assets);
    } catch {
      /* preview just shows placeholders */
    }
  }, [siteId]);

  useEffect(() => {
    // Initial load of the photo/song library (signed preview URLs), refreshed before they expire.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLibrary();
    const iv = setInterval(loadLibrary, 90 * 60_000);
    return () => clearInterval(iv);
  }, [loadLibrary]);

  // ───────── autosave (debounced, sequential, optimistic concurrency) ─────────
  const flush = useCallback(async (): Promise<void> => {
    if (inflight.current) await inflight.current;
    if (!dirty.current) return;
    dirty.current = false;
    const body = latest.current;
    setSave("saving");
    inflight.current = (async () => {
      try {
        const r = await api<{ revision: number }>(`/api/sites/${siteId}/draft`, { method: "PUT", body: { content: body, revision: revision.current } });
        revision.current = r.revision;
        savedJson.current = JSON.stringify(body);
        setSave(dirty.current ? "unsaved" : "saved");
      } catch (e) {
        dirty.current = true;
        if (e instanceof ApiFailure && e.code === "revision_conflict") setSave("conflict");
        else if (e instanceof ApiFailure && e.status === 0) setSave("offline");
        else {
          setSave("error");
          if (e instanceof ApiFailure) setNotice(e.message);
        }
      } finally {
        inflight.current = null;
      }
    })();
    await inflight.current;
  }, [siteId]);

  useEffect(() => {
    latest.current = c;
    if (JSON.stringify(c) === savedJson.current) return;
    dirty.current = true;
    setSave("unsaved");
    setIssues([]);
    const t = setTimeout(() => void flush(), 900);
    return () => clearTimeout(t);
  }, [c, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || inflight.current) e.preventDefault();
    };
    const online = () => void flush();
    addEventListener("beforeunload", warn);
    addEventListener("online", online);
    return () => {
      removeEventListener("beforeunload", warn);
      removeEventListener("online", online);
    };
  }, [flush]);

  // ───────── live preview (same-origin iframe running the real renderer) ─────────
  const post = useCallback(() => {
    const media = { images: {} as Record<string, { src: string; srcSet?: string }>, audio: {} as Record<string, { src: string }> };
    for (const a of library) {
      if (!a.src) continue;
      if (a.kind === "image") media.images[a.id] = { src: a.src, srcSet: a.srcSmall ? `${a.srcSmall} 480w, ${a.src} 1200w` : undefined };
      else media.audio[a.id] = { src: a.src };
    }
    frame.current?.contentWindow?.postMessage({ type: "bday:content", content: c, media }, window.location.origin);
  }, [c, library]);

  useEffect(() => {
    post();
  }, [post]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === frame.current?.contentWindow && (e.data as { type?: string })?.type === "bday:ready") post();
    };
    addEventListener("message", onMsg);
    return () => removeEventListener("message", onMsg);
  }, [post]);

  async function publish() {
    setPublishing(true);
    setIssues([]);
    setNotice(null);
    try {
      dirty.current = true;
      await flush();
      const r = await api<{ url: string }>(`/api/sites/${siteId}/publish`, { method: "POST" });
      setPublished(r.url);
      setNotice(null);
    } catch (e) {
      if (e instanceof ApiFailure && Array.isArray(e.data.issues)) setIssues(e.data.issues as Issue[]);
      else setNotice(e instanceof ApiFailure ? e.message : "Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  const saveLabel: Record<SaveState, string> = {
    saved: "All changes saved",
    unsaved: "Unsaved changes…",
    saving: "Saving…",
    error: "Couldn't save",
    conflict: "Edited in another tab",
    offline: "Offline — will retry",
  };

  const lib = { siteId, library, onUploaded: loadLibrary };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_420px] sm:px-6">
      <div className="min-w-0">
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div>
            <Link href={`/dashboard/sites/${siteId}`} className="text-sm font-bold underline">
              ← Share & settings
            </Link>
            <p className={`text-sm ${save === "error" || save === "conflict" ? "text-rose" : "text-ink-soft"}`} role="status" aria-live="polite" data-testid="save-state">
              {saveLabel[save]}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setShowPreview(true)}>
              Preview
            </Button>
            <Button onClick={publish} disabled={publishing} data-testid="publish">
              {publishing ? "Publishing…" : published ? "Publish changes" : "Publish"}
            </Button>
          </div>
        </div>

        {save === "conflict" && (
          <Notice tone="error">
            This site was changed somewhere else.{" "}
            <button className="font-bold underline" onClick={() => window.location.reload()}>
              Reload the latest version
            </button>{" "}
            (your last few edits here won&apos;t be kept).
          </Notice>
        )}
        {notice && <Notice tone="error">{notice}</Notice>}
        {issues.length > 0 && (
          <Notice tone="error">
            <p className="font-bold">Almost there — please fill in:</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.map((i) => (
                <li key={i.path}>{describe(i.path)}</li>
              ))}
            </ul>
          </Notice>
        )}
        {published && (
          <Notice tone="success">
            Published! Your link: <span className="font-mono break-all" data-testid="published-url">{published}</span> ·{" "}
            <Link className="font-bold underline" href={`/dashboard/sites/${siteId}`}>
              Share it
            </Link>
          </Notice>
        )}

        <div className="mt-4 space-y-3">
          <Section id="names" title="1. Names & cover" open>
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Their name" name="recipientName" required max={40} value={c.recipientName} onChange={(v) => edit((d) => void (d.recipientName = v))} placeholder="e.g. Priya" />
              <Text label="Your name" name="senderName" required max={40} value={c.senderName} onChange={(v) => edit((d) => void (d.senderName = v))} />
              <Text label="Pet name you call them" max={30} value={c.petName} onChange={(v) => edit((d) => void (d.petName = v))} placeholder="used as {pet}" />
              <Text label="Date on the stamp" max={12} value={c.birthdayDate} onChange={(v) => edit((d) => void (d.birthdayDate = v))} placeholder="14 FEB" />
              <Text label="Orange date on photos" max={16} value={c.photoDateStamp} onChange={(v) => edit((d) => void (d.photoDateStamp = v))} placeholder="leave empty to hide" />
              <Text label="Cover title" max={40} value={c.cover.titleTop} onChange={(v) => edit((d) => void (d.cover.titleTop = v))} />
            </div>
            <Text label="Handwritten line" max={90} value={c.cover.handwritten} onChange={(v) => edit((d) => void (d.cover.handwritten = v))} />
            <PhotoPicker label="Cover photo" value={c.cover.photo} onChange={(r) => edit((d) => void (d.cover.photo = r))} {...lib} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Cover photo caption" max={40} value={c.cover.photoCaption} onChange={(v) => edit((d) => void (d.cover.photoCaption = v))} />
              <Text label="Cover button" required max={32} value={c.cover.button} onChange={(v) => edit((d) => void (d.cover.button = v))} />
            </div>
            <p className="text-xs text-ink-soft">Tip: write {"{name}"}, {"{sender}"} or {"{pet}"} anywhere and it&apos;s filled in for you.</p>
          </Section>

          <Section id="questions" title="2. Little questions" hint="Each question has two answers and a reply for each.">
            {c.questions.map((q, i) => (
              <fieldset key={i} className="space-y-3 rounded-xl bg-baby/50 p-3">
                <legend className="sr-only">Question {i + 1}</legend>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold">Question {i + 1}</p>
                  <ListControls index={i} count={c.questions.length} min={1} label={`question ${i + 1}`} onMove={(to) => edit((d) => void (d.questions = move(d.questions, i, to)))} onRemove={() => edit((d) => void d.questions.splice(i, 1))} />
                </div>
                <Text label="Question" required max={120} value={q.q} onChange={(v) => edit((d) => void (d.questions[i]!.q = v))} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1].map((k) => (
                    <div key={k} className="space-y-2">
                      <Text label={`Answer ${k + 1}`} required max={24} value={q.options[k as 0 | 1]} onChange={(v) => edit((d) => void (d.questions[i]!.options[k as 0 | 1] = v))} />
                      <Text label={`Reply to answer ${k + 1}`} max={60} value={q.replies[k as 0 | 1]} onChange={(v) => edit((d) => void (d.questions[i]!.replies[k as 0 | 1] = v))} />
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
            {c.questions.length < 5 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.questions.push({ q: "", options: ["YES ♡", "OF COURSE"], replies: ["", ""] }))}>
                + Add question
              </Button>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Text label="After the questions (line 1)" max={30} value={c.startLine[0]} onChange={(v) => edit((d) => void (d.startLine[0] = v))} />
              <Text label="Line 2" max={30} value={c.startLine[1]} onChange={(v) => edit((d) => void (d.startLine[1] = v))} />
              <Text label="Button" required max={16} value={c.startButton} onChange={(v) => edit((d) => void (d.startButton = v))} />
            </div>
          </Section>

          <Section id="letter" title="3. Your letter">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Envelope label" max={20} value={c.letter.envelopeLabel} onChange={(v) => edit((d) => void (d.letter.envelopeLabel = v))} />
              <Text label="Greeting" max={80} value={c.letter.greeting} onChange={(v) => edit((d) => void (d.letter.greeting = v))} />
            </div>
            {c.letter.body.map((p, i) => (
              <div key={i}>
                <div className="flex justify-end">
                  <ListControls index={i} count={c.letter.body.length} min={1} label={`paragraph ${i + 1}`} onMove={(to) => edit((d) => void (d.letter.body = move(d.letter.body, i, to)))} onRemove={() => edit((d) => void d.letter.body.splice(i, 1))} />
                </div>
                <Text label={`Paragraph ${i + 1}`} required multiline max={700} value={p} onChange={(v) => edit((d) => void (d.letter.body[i] = v))} />
              </div>
            ))}
            {c.letter.body.length < 6 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.letter.body.push(""))}>
                + Add paragraph
              </Button>
            )}
            <Text label="Closing line" multiline max={240} value={c.letter.closing} onChange={(v) => edit((d) => void (d.letter.closing = v))} />
            <Text label="Sign-off" max={30} value={c.letter.signoff} onChange={(v) => edit((d) => void (d.letter.signoff = v))} />
          </Section>

          <Section id="memories" title="4. Memories (photos)" hint="Up to 12 photos. iPhone HEIC photos are converted automatically. Location data is removed.">
            <Text label="Page title" max={40} value={c.memoriesTitle} onChange={(v) => edit((d) => void (d.memoriesTitle = v))} />
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.memories.map((m, i) => (
                <li key={i} className="space-y-2 rounded-xl bg-baby/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold">Photo {i + 1}</p>
                    <ListControls index={i} count={c.memories.length} min={1} label={`photo ${i + 1}`} onMove={(to) => edit((d) => void (d.memories = move(d.memories, i, to)))} onRemove={() => edit((d) => void d.memories.splice(i, 1))} />
                  </div>
                  <PhotoPicker label="Photo" value={m.image} onChange={(r) => edit((d) => void (d.memories[i]!.image = r))} {...lib} />
                  <Text label="Caption" max={40} value={m.caption} onChange={(v) => edit((d) => void (d.memories[i]!.caption = v))} />
                </li>
              ))}
            </ul>
            {c.memories.length < 12 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.memories.push({ image: null, caption: "" }))}>
                + Add photo
              </Button>
            )}
          </Section>

          <Section id="coupons" title="5. Coupons">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Page title" max={40} value={c.couponsTitle} onChange={(v) => edit((d) => void (d.couponsTitle = v))} />
              <Text label="Note under the title" max={90} value={c.couponsNote} onChange={(v) => edit((d) => void (d.couponsNote = v))} />
            </div>
            {c.coupons.map((cp, i) => (
              <div key={i} className="space-y-2 rounded-xl bg-baby/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold">Coupon {i + 1}</p>
                  <ListControls index={i} count={c.coupons.length} min={1} label={`coupon ${i + 1}`} onMove={(to) => edit((d) => void (d.coupons = move(d.coupons, i, to)))} onRemove={() => edit((d) => void d.coupons.splice(i, 1))} />
                </div>
                <Text label="Good for…" required max={28} value={cp.title} onChange={(v) => edit((d) => void (d.coupons[i]!.title = v))} />
                <Text label="The fine print" multiline max={160} value={cp.message} onChange={(v) => edit((d) => void (d.coupons[i]!.message = v))} />
              </div>
            ))}
            {c.coupons.length < 8 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.coupons.push({ title: "", message: "" }))}>
                + Add coupon
              </Button>
            )}
          </Section>

          <Section id="song" title="6. Our song & reasons">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Song title" max={50} value={c.song.title} onChange={(v) => edit((d) => void (d.song.title = v))} />
              <Text label="Artist" max={50} value={c.song.artist} onChange={(v) => edit((d) => void (d.song.artist = v))} />
            </div>
            <AudioPicker value={c.song.audio} onChange={(r) => edit((d) => void (d.song.audio = r))} {...lib} />
            <PhotoPicker label="Photo on the CD" value={c.song.cover} onChange={(r) => edit((d) => void (d.song.cover = r))} {...lib} />
            <Text label="List title" max={50} value={c.reasonsTitle} onChange={(v) => edit((d) => void (d.reasonsTitle = v))} />
            {c.reasons.map((r, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Text label={`Reason ${i + 1}`} required max={60} value={r} onChange={(v) => edit((d) => void (d.reasons[i] = v))} />
                </div>
                <ListControls index={i} count={c.reasons.length} min={1} label={`reason ${i + 1}`} onMove={(to) => edit((d) => void (d.reasons = move(d.reasons, i, to)))} onRemove={() => edit((d) => void d.reasons.splice(i, 1))} />
              </div>
            ))}
            {c.reasons.length < 8 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.reasons.push(""))}>
                + Add reason
              </Button>
            )}
          </Section>

          <Section id="surprise" title="7. Cupcake surprise">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Title" max={40} value={c.surprise.titleTop} onChange={(v) => edit((d) => void (d.surprise.titleTop = v))} />
              <Text label="Small line" max={90} value={c.surprise.small} onChange={(v) => edit((d) => void (d.surprise.small = v))} />
              <Text label="Hint" max={40} value={c.surprise.hint} onChange={(v) => edit((d) => void (d.surprise.hint = v))} />
              <Text label="After the wish" max={60} value={c.surprise.afterTap} onChange={(v) => edit((d) => void (d.surprise.afterTap = v))} />
              <Text label="Next button" required max={32} value={c.surprise.next} onChange={(v) => edit((d) => void (d.surprise.next = v))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((k) => (
                <div key={k} className="space-y-2">
                  <PhotoPicker label={k ? "Right photo" : "Left photo"} value={c.surprise.photos[k as 0 | 1]} onChange={(r) => edit((d) => void (d.surprise.photos[k as 0 | 1] = r))} {...lib} />
                  <Text label="Caption" max={20} value={c.surprise.captions[k as 0 | 1]} onChange={(v) => edit((d) => void (d.surprise.captions[k as 0 | 1] = v))} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="final" title="8. The final surprise">
            {c.final.wait.map((w, i) => (
              <Text key={i} label={`Build-up line ${i + 1}`} required max={30} value={w} onChange={(v) => edit((d) => void (d.final.wait[i] = v))} />
            ))}
            <Text label="Heading" max={60} value={c.final.heading} onChange={(v) => edit((d) => void (d.final.heading = v))} />
            <Text label="Message" multiline max={240} value={c.final.finalMessage} onChange={(v) => edit((d) => void (d.final.finalMessage = v))} />
            <PhotoPicker label="Final photo" value={c.final.photo} onChange={(r) => edit((d) => void (d.final.photo = r))} {...lib} />
            <Text label="Photo caption" max={40} value={c.final.photoCaption} onChange={(v) => edit((d) => void (d.final.photoCaption = v))} />
            {c.final.lines.map((l, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Text label={`Closing line ${i + 1}`} required max={60} value={l} onChange={(v) => edit((d) => void (d.final.lines[i] = v))} />
                </div>
                <ListControls index={i} count={c.final.lines.length} min={0} label={`closing line ${i + 1}`} onMove={(to) => edit((d) => void (d.final.lines = move(d.final.lines, i, to)))} onRemove={() => edit((d) => void d.final.lines.splice(i, 1))} />
              </div>
            ))}
            {c.final.lines.length < 6 && (
              <Button variant="secondary" onClick={() => edit((d) => void d.final.lines.push(""))}>
                + Add line
              </Button>
            )}
            <Text label="Restart button" required max={24} value={c.final.restart} onChange={(v) => edit((d) => void (d.final.restart = v))} />
          </Section>

          <Section id="theme" title="9. Colours">
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Colour theme">
              {Object.entries(THEME_PRESETS).map(([key, p]) => {
                const active = JSON.stringify(p.theme) === JSON.stringify(c.theme);
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => edit((d) => void (d.theme = { ...p.theme }))}
                    className={`rounded-xl border-2 p-3 text-left ${active ? "border-rose" : "border-ink/15"}`}
                  >
                    <span className="flex gap-1">
                      {Object.values(p.theme).map((col, i) => (
                        <span key={i} className="size-5 rounded-full border border-ink/10" style={{ background: col }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-sm font-bold">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section id="wording" title="10. Small wording (optional)" hint="Labels on cards and buttons. The defaults work well — change them if you like.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Menu title" max={40} value={c.menuTitle} onChange={(v) => edit((d) => void (d.menuTitle = v))} />
              <Text label="Menu note" max={90} value={c.menuNote} onChange={(v) => edit((d) => void (d.menuNote = v))} />
              {(Object.keys(c.cards) as (keyof ScrapbookContent["cards"])[]).map((k) => (
                <Text key={k} label={`Card: ${k}`} required max={20} value={c.cards[k]} onChange={(v) => edit((d) => void (d.cards[k] = v))} />
              ))}
              <Text label="Memories: tap hint" max={60} value={c.copy.memoriesNote} onChange={(v) => edit((d) => void (d.copy.memoriesNote = v))} />
              <Text label="Envelope hint" max={40} value={c.copy.tapEnvelope} onChange={(v) => edit((d) => void (d.copy.tapEnvelope = v))} />
              <Text label="Song: press play" max={60} value={c.copy.pressPlay} onChange={(v) => edit((d) => void (d.copy.pressPlay = v))} />
              <Text label="Song: while playing" max={80} value={c.copy.playingSong} onChange={(v) => edit((d) => void (d.copy.playingSong = v))} />
              <Text label="Coupon: signed" max={60} value={c.copy.couponFrom} onChange={(v) => edit((d) => void (d.copy.couponFrom = v))} />
              <Text label="Coupon: validity" max={40} value={c.copy.couponNo} onChange={(v) => edit((d) => void (d.copy.couponNo = v))} />
            </div>
          </Section>
        </div>
      </div>

      <aside
        className={`${showPreview ? "fixed inset-0 z-50 flex flex-col bg-ink/90 p-3" : "hidden"} lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-2rem)] lg:bg-transparent lg:p-0`}
        aria-label="Live preview"
      >
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <p className="font-bold text-white">Live preview</p>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </div>
        <div className="mx-auto h-full max-h-[860px] w-full max-w-[420px] flex-1 overflow-hidden rounded-[2rem] border-[8px] border-ink bg-ink shadow-[6px_6px_0_var(--color-pink)]">
          <iframe ref={frame} src={`/preview/${siteId}`} title="Live preview of your birthday site" className="block size-full bg-baby" onLoad={post} />
        </div>
        <p className="mt-2 hidden text-center text-xs text-ink-soft lg:block">Only you can see this preview. Changes appear as you type.</p>
      </aside>
    </div>
  );
}
