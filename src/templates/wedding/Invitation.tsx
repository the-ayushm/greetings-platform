"use client";

import "./fonts.css";
import "./wedding.css";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createFileMusic, createMusicBox, type Music } from "@/templates/scrapbook/engine/music";
import { ArtDefs, EmbossTile, Petal } from "./art";
import { Ctx, store, type MediaMap, type RenderMode, type SendRsvp, type WeddingCtx } from "./context";
import { Envelope, type EnvelopeState } from "./Envelope";
import { RsvpSection } from "./Rsvp";
import type { WeddingContent } from "./schema";
import { Closing, Couple, CountdownSection, Cover, DressCode, Location, Schedule } from "./sections";
import { formatDots, formatLong } from "./time";
import { themeVars } from "./theme";

export type { MediaMap, RsvpResult, SendRsvp } from "./context";

export type WeddingInvitationProps = {
  content: WeddingContent;
  mode: RenderMode;
  media: MediaMap;
  /** Namespaces browser storage per invitation (envelope opened, RSVP sent). */
  storageKey: string;
  onMediaError?: (assetId: string) => void;
  /** Live page only: posts an RSVP to the server. */
  sendRsvp?: SendRsvp;
  /** Section to show first (studio preview / demo links). `nonce` re-triggers the jump. */
  start?: { target: string | null; nonce: number };
};

/** Opening sequence length; the reduced-motion version is a short fade. */
const OPEN_MS = 2300;
const OPEN_MS_STILL = 350;
const PETALS = [
  { left: "6%", delay: "0s", dur: "17s", size: 14 },
  { left: "22%", delay: "6s", dur: "21s", size: 11 },
  { left: "41%", delay: "11s", dur: "19s", size: 16 },
  { left: "63%", delay: "3s", dur: "23s", size: 12 },
  { left: "78%", delay: "9s", dur: "18s", size: 15 },
  { left: "92%", delay: "14s", dur: "22s", size: 10 },
];

export function WeddingInvitation({ content: c, mode, media, storageKey, onMediaError, sendRsvp, start }: WeddingInvitationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const startsOnSection = Boolean(start?.target && start.target !== "envelope" && start.target !== "cover");
  const [env, setEnv] = useState<EnvelopeState | "gone">(c.envelope.enabled && !startsOnSection ? "closed" : "gone");
  const openedKey = `wd:opened:${storageKey}`;

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    // Client-only facts applied after hydration: motion preference, an earlier visit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStill(mq.matches);
    setHydrated(true);
    const on = () => setStill(mq.matches);
    mq.addEventListener("change", on);
    // Returning guests skip the envelope (a quick fade instead of the full sequence).
    if (mode === "live" && store.get(openedKey)) setEnv((e) => (e === "closed" ? "skip" : e));
    return () => mq.removeEventListener("change", on);
  }, [mode, openedKey]);

  // Overscroll / safe-area areas outside the root show the theme's darkest colour.
  useEffect(() => {
    document.documentElement.style.backgroundColor = c.theme.wine;
  }, [c.theme.wine]);

  useEffect(() => {
    if (env !== "opening" && env !== "skip") return;
    const t = setTimeout(() => setEnv("gone"), env === "skip" ? OPEN_MS_STILL : still ? OPEN_MS_STILL : OPEN_MS);
    return () => clearTimeout(t);
  }, [env, still]);

  /* ───────── music: only ever started by a tap ───────── */
  const musicRef = useRef<Music | null>(null);
  const [playing, setPlaying] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const audioSrc = c.music.mode === "file" && c.music.audio ? media.audio[c.music.audio.assetId]?.src : undefined;
  const audioId = c.music.audio?.assetId;

  const ensureMusic = useCallback(() => {
    if (c.music.mode === "none") return null;
    if (!musicRef.current) {
      if (c.music.mode === "file") {
        if (!audioSrc) return null;
        const m = createFileMusic(audioSrc);
        m.onError?.(() => {
          setMusicError(true);
          setPlaying(false);
          if (audioId) onMediaError?.(audioId);
        });
        musicRef.current = m;
      } else musicRef.current = createMusicBox();
    }
    return musicRef.current;
  }, [c.music.mode, audioSrc, audioId, onMediaError]);

  const play = useCallback(async () => {
    const m = ensureMusic();
    if (!m) return setMusicError(true);
    setMusicError(false);
    try {
      await m.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [ensureMusic]);

  const toggleMusic = useCallback(() => {
    if (playing) {
      musicRef.current?.pause();
      setPlaying(false);
    } else void play();
  }, [playing, play]);

  useEffect(() => {
    if (audioSrc && musicRef.current && !musicRef.current.demo) musicRef.current.setSrc?.(audioSrc);
  }, [audioSrc]);
  useEffect(
    () => () => {
      musicRef.current?.destroy();
      musicRef.current = null;
      setPlaying(false);
    },
    [c.music.mode, audioId],
  );

  const open = useCallback(() => {
    setEnv("opening");
    if (mode === "live") store.set(openedKey, "1");
    if (c.music.startOnOpen && c.music.mode !== "none") void play();
  }, [mode, openedKey, c.music.startOnOpen, c.music.mode, play]);

  const reopenEnvelope = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setEnv("closed");
  }, []);

  /* ───────── studio / demo jumps ───────── */
  const nonce = start?.nonce;
  const target = start?.target;
  useEffect(() => {
    // Nothing to jump to on first render without a target (the envelope stays as it is).
    if (nonce === undefined || (nonce === 0 && !target)) return;
    if (target === "envelope") {
      if (c.envelope.enabled) {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnv("closed");
      }
      return;
    }
    setEnv("gone");
    const el = target ? document.getElementById(`wd-${target}`) : null;
    requestAnimationFrame(() => (el ? el.scrollIntoView({ block: "start" }) : window.scrollTo({ top: 0 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  /* ───────── gentle reveal on scroll (content stays visible without JS) ───────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    root.querySelectorAll(".wd-reveal:not([data-in])").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [c.sections, hydrated]);

  const fill = useMemo(() => {
    const date = formatLong(c.event.date);
    const dots = formatDots(c.event.date);
    return (s: string) =>
      s
        .replace(/\{bride\}/g, c.couple.brideName || "Bride")
        .replace(/\{groom\}/g, c.couple.groomName || "Groom")
        .replace(/\{date\}/g, date || dots);
  }, [c.couple.brideName, c.couple.groomName, c.event.date]);

  const image = useCallback((id: string | null | undefined) => (id ? media.images[id] ?? null : null), [media]);
  const reportMediaError = useCallback((id: string) => onMediaError?.(id), [onMediaError]);

  const ctx: WeddingCtx = { c, mode, fill, image, reportMediaError, still, storageKey, sendRsvp, reopenEnvelope };
  const vars = themeVars(c.theme) as CSSProperties;
  const s = c.sections;
  const showPetals = hydrated && !still && env === "gone";

  return (
    <Ctx.Provider value={ctx}>
      <div ref={rootRef} className="wd" style={vars} data-env={env} data-mode={mode} data-motion={still ? "off" : "on"} data-hydrated={hydrated ? "" : undefined}>
        <ArtDefs />
        <EmbossTile />
        {env !== "gone" && <Envelope state={env} initials={c.couple.initials || "♡"} hint={c.envelope.hint} onOpen={open} />}
        {/* Without JavaScript the envelope can't open: hide it so the invitation is still readable. */}
        <noscript>
          <style>{".wd-env{display:none!important}"}</style>
        </noscript>
        <div className="wd-page" inert={env === "closed"}>
          <Cover />
          <main id="wd-main" className="wd-main">
            {s.couple && <Couple />}
            {s.countdown && <CountdownSection />}
            {s.schedule && <Schedule />}
            {s.location && <Location />}
            {s.dresscode && <DressCode />}
            {s.rsvp && <RsvpSection />}
          </main>
          <Closing />
        </div>
        {showPetals && (
          <div className="wd-petals" aria-hidden="true">
            {PETALS.map((p, i) => (
              <Petal key={i} className="wd-petal-fall" style={{ left: p.left, width: p.size, height: p.size * 1.2, animationDelay: p.delay, animationDuration: p.dur }} />
            ))}
          </div>
        )}
        {c.music.mode !== "none" && env === "gone" && (
          <button type="button" className={`wd-music ${playing ? "on" : ""}`} onClick={toggleMusic} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} title={musicError ? "The music couldn't load" : undefined} data-testid="wd-music">
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 5.5v13l10.5-6.5z" />
              </svg>
            )}
          </button>
        )}
        {mode === "preview" && <p className="wd-preview-tag">preview · only you can see this</p>}
      </div>
    </Ctx.Provider>
  );
}
