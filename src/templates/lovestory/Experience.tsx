"use client";

import "@/templates/scrapbook/fonts/fonts.css";
import "./lovestory.css";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createFileMusic, createMusicBox, type Music } from "@/templates/scrapbook/engine/music";
import { Heart } from "./art";
import { buildSteps, Ctx, stepForTarget, type LoveCtx, type MediaMap, type RenderMode, type Respond } from "./context";
import { Ambient } from "./parts";
import type { LoveContent } from "./schema";
import { Calendar } from "./sections/Calendar";
import { Coupons, Final, Letter, PhotoWall } from "./sections/Keepsakes";
import { QuestionStep } from "./sections/Quiz";
import { Scrapbook, Timeline, Unlock } from "./sections/Story";
import { Welcome } from "./sections/Welcome";
import { makeFill, parseIso } from "./text";
import { MOTION_HEARTS, themeVars } from "./theme";

export type { MediaMap } from "./context";
export type MusicApi = { playing: boolean; pos: number; dur: number; error: boolean; started: boolean; toggle: () => void };

export type LoveExperienceProps = {
  content: LoveContent;
  mode: RenderMode;
  media: MediaMap;
  /** Namespaces browser storage per site so one story's state never shows on another. */
  storageKey: string;
  onMediaError?: (assetId: string) => void;
  /** Live page only: sends a response to the server. Resolves true when stored. */
  onRespond?: (kind: "text" | "slider" | "coupon", itemId: string, value: string) => Promise<"stored" | "off" | "failed">;
  /** Section/step to open on (demo deep links, studio preview). `nonce` re-triggers the jump. */
  start?: { target: string | null; nonce: number };
  /** Server's date (YYYY-MM-DD) so first render matches; replaced by the device date after mount. */
  today?: string;
};

function dateFrom(iso: string | undefined) {
  const p = iso ? parseIso(iso) : null;
  return p ? new Date(p.y, p.m, p.d) : new Date(2000, 0, 1);
}

export function LoveExperience({ content: c, mode, media, storageKey, onMediaError, onRespond, start, today }: LoveExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const steps = useMemo(() => buildSteps(c), [c]);
  const [index, setIndex] = useState(() => stepForTarget(steps, start?.target));
  const [reduced, setReduced] = useState(false);
  const [now, setNow] = useState(() => dateFrom(today));
  const [announce, setAnnounce] = useState("");
  const step = steps[Math.min(index, steps.length - 1)]!;
  const at = Math.min(index, steps.length - 1);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    // Client-only facts (motion preference, device date) applied after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches);
    setNow(new Date());
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    rootRef.current?.setAttribute("data-hydrated", "");
    return () => mq.removeEventListener("change", on);
  }, []);

  // Studio preview / demo links: jump when asked (nonce changes), not on every content edit.
  const nonce = start?.nonce;
  const target = start?.target;
  useEffect(() => {
    if (nonce === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(stepForTarget(steps, target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const still = reduced || c.theme.motion === "off";
  const fill = useMemo(() => makeFill(c, now), [c, now]);

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(steps.length - 1, i));
      setIndex(n);
      rootRef.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setAnnounce(`Page ${n + 1} of ${steps.length}`);
    },
    [steps.length],
  );
  const next = useCallback(() => go(at + 1), [go, at]);
  const back = useCallback(() => go(at - 1), [go, at]);
  const restart = useCallback(() => go(0), [go]);

  /* ───────── music (only ever started by a tap) ───────── */
  const musicRef = useRef<Music | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [musicError, setMusicError] = useState(false);
  const audioSrc = c.music.mode === "file" && c.music.audio ? media.audio[c.music.audio.assetId]?.src : undefined;
  const audioId = c.music.audio?.assetId;

  const ensureMusic = useCallback(() => {
    if (c.music.mode === "none") return null;
    if (!musicRef.current) {
      if (c.music.mode === "file") {
        if (!audioSrc) {
          setMusicError(true);
          return null;
        }
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
    if (!m) return;
    setMusicError(false);
    try {
      await m.play();
      setPlaying(true);
      setStarted(true);
    } catch {
      setPlaying(false);
    }
  }, [ensureMusic]);

  const toggle = useCallback(() => {
    if (playing) {
      musicRef.current?.pause();
      setPlaying(false);
    } else void play();
  }, [playing, play]);

  const startMusic = useCallback(() => {
    if (!started && c.music.mode !== "none") void play();
  }, [started, play, c.music.mode]);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      const m = musicRef.current;
      if (!m) return;
      setPos(m.pos());
      setDur(m.dur());
    }, 500);
    return () => clearInterval(iv);
  }, [playing]);

  // Refreshed signed URL → swap the source; a changed song/mode in the studio → start over.
  useEffect(() => {
    if (audioSrc && musicRef.current && !musicRef.current.demo) musicRef.current.setSrc?.(audioSrc);
  }, [audioSrc]);
  useEffect(
    () => () => {
      musicRef.current?.destroy();
      musicRef.current = null;
      setPlaying(false);
      setStarted(false);
    },
    [c.music.mode, audioId],
  );

  /* ───────── heart bursts ───────── */
  const burst = useCallback(
    (el: Element | null, n = 12) => {
      const layer = burstRef.current;
      if (still || !layer || !el || !n) return;
      const r = el.getBoundingClientRect();
      const L = layer.getBoundingClientRect();
      const cx = r.left + r.width / 2 - L.left;
      const cy = r.top + r.height / 2 - L.top;
      for (let i = 0; i < Math.min(n, 30); i++) {
        const s = document.createElement("span");
        s.className = "lu-pop";
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const d = 50 + Math.random() * 70;
        s.style.left = `${cx}px`;
        s.style.top = `${cy}px`;
        s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
        s.style.setProperty("--dy", `${Math.sin(a) * d - 30}px`);
        s.style.setProperty("--s", `${0.6 + Math.random() * 0.8}`);
        s.textContent = "♥";
        layer.appendChild(s);
        setTimeout(() => s.remove(), 1300);
      }
    },
    [still],
  );

  /* ───────── responses ───────── */
  const respond: Respond = useCallback(
    async (kind, itemId, value) => {
      if (mode !== "live") return "preview";
      if (!c.responses.collect) return "off";
      if (!onRespond) return "failed";
      try {
        return await onRespond(kind, itemId, value);
      } catch {
        return "failed";
      }
    },
    [mode, c.responses.collect, onRespond],
  );

  const image = useCallback((id: string | null | undefined) => (id ? media.images[id] ?? null : null), [media]);
  const reportMediaError = useCallback((id: string) => onMediaError?.(id), [onMediaError]);

  const ctx: LoveCtx = { c, mode, fill, image, reportMediaError, still, next, back, restart, stepIndex: at, stepCount: steps.length, burst, respond, startMusic, storageKey };
  const music: MusicApi = { playing, pos, dur, error: musicError, started, toggle };

  const vars = themeVars(c.theme) as CSSProperties;
  const hearts = still || !c.theme.hearts ? 0 : MOTION_HEARTS[c.theme.motion];

  return (
    <Ctx.Provider value={ctx}>
      <div
        ref={rootRef}
        className="lu"
        style={vars}
        data-fonts={c.theme.fonts}
        data-border={c.theme.border}
        data-backdrop={c.theme.backdrop}
        data-motion={still ? "off" : c.theme.motion}
        data-mode={mode}
      >
        <Ambient hearts={hearts} sparkles={c.theme.sparkles && !still} />
        <div className="lu-progress" role="progressbar" aria-label="Story progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={at + 1}>
          <span style={{ width: `${(at / Math.max(1, steps.length - 1)) * 100}%` }} />
        </div>
        {mode === "preview" && <p className="lu-preview-tag">preview · only you can see this</p>}
        <main className="lu-stage" key={step.key}>
          {step.kind === "welcome" && <Welcome music={music} />}
          {step.kind === "question" && <QuestionStep index={step.question!} />}
          {step.kind === "unlock" && <Unlock />}
          {step.kind === "timeline" && <Timeline />}
          {step.kind === "scrapbook" && <Scrapbook />}
          {step.kind === "calendar" && <Calendar today={now} />}
          {step.kind === "letter" && <Letter />}
          {step.kind === "coupons" && <Coupons />}
          {step.kind === "photowall" && <PhotoWall />}
          {step.kind === "final" && <Final />}
        </main>
        {started && step.kind !== "welcome" && (
          <button type="button" className={`lu-music-pill ${playing ? "on" : ""}`} onClick={toggle} aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing}>
            <Heart />
            <span aria-hidden="true">{playing ? "♪" : "▶"}</span>
          </button>
        )}
        <div ref={burstRef} className="lu-burst" aria-hidden="true" />
        <p className="lu-sr" aria-live="polite">
          {announce}
        </p>
      </div>
    </Ctx.Provider>
  );
}
