"use client";

import "@/templates/scrapbook/fonts/fonts.css";
import "./ask.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { createFileMusic, createMusicBox, type Music } from "@/templates/scrapbook/engine/music";
import { Buddy, Heart, moodFor, Sparkle } from "./art";
import { fillTokens, growth, noLabel, type AskContent, type Intensity } from "./schema";
import { createSfx, type Sfx } from "./sound";
import { themeVars } from "./theme";

/** live = the partner's page · preview = owner's studio iframe · demo = public sample */
export type RenderMode = "live" | "preview" | "demo";
export type ResolvedImage = { src: string; srcSet?: string };
export type MediaMap = { images: Record<string, ResolvedImage>; audio: Record<string, { src: string }> };

type Stage = "ask" | "takeover" | "finale";
const STAGES: readonly Stage[] = ["ask", "takeover", "finale"];

export type AskExperienceProps = {
  content: AskContent;
  mode: RenderMode;
  media: MediaMap;
  onMediaError?: (assetId: string) => void;
  /** Live page only: called once when they say Yes, with how many times they pressed No. */
  onAnswer?: (noCount: number) => void;
  /** Screen to show (studio preview / demo links). `nonce` re-triggers the jump. */
  start?: { target: string | null; nonce: number };
};

/** How much decoration each intensity setting draws. */
const AMOUNT: Record<Intensity, { ambient: number; sparkles: number; confetti: number; rising: number; burst: number }> = {
  calm: { ambient: 5, sparkles: 4, confetti: 26, rising: 8, burst: 8 },
  playful: { ambient: 9, sparkles: 7, confetti: 54, rising: 14, burst: 12 },
  extra: { ambient: 14, sparkles: 10, confetti: 90, rising: 22, burst: 16 },
};

const EXPAND_MS = 950;
const REVEAL_MS = 1100;

/** Small deterministic PRNG so server and client draw the same decoration (no hydration drift). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Var = CSSProperties & Record<`--${string}`, string | number>;

function initialStage(start: AskExperienceProps["start"]): Stage {
  const t = start?.target;
  return t && (STAGES as readonly string[]).includes(t) ? (t as Stage) : "ask";
}

export function AskExperience({ content: c, mode, media, onMediaError, onAnswer, start }: AskExperienceProps) {
  const total = Math.max(1, c.question.noMessages.length);
  const [stage, setStage] = useState<Stage>(() => initialStage(start));
  const [noCount, setNoCount] = useState(() => (initialStage(start) === "takeover" ? total : 0));
  const [still, setStill] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [round, setRound] = useState(0);
  /** clip-path the full-screen Yes starts from (the Yes button's own box), null = already full. */
  const [expandFrom, setExpandFrom] = useState<string | null>(null);
  /** Point the finale grows out of (where they tapped Yes). */
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const answered = useRef(false);
  const amount = AMOUNT[c.look.intensity];
  const fill = useCallback((s: string) => fillTokens(s, c), [c]);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    // Client-only facts applied after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStill(mq.matches);
    setHydrated(true);
    const on = () => setStill(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Overscroll / safe-area areas outside the page show the theme's background.
  useEffect(() => {
    document.documentElement.style.backgroundColor = c.theme.bg2;
  }, [c.theme.bg2]);

  // Studio preview / demo links: jump to a screen.
  // Only a new nonce jumps (editing the content must not reset what the customer is looking at).
  const nonce = start?.nonce ?? 0;
  const [seenNonce, setSeenNonce] = useState(nonce);
  if (nonce !== seenNonce) {
    setSeenNonce(nonce);
    const s = initialStage(start);
    setStage(s);
    setNoCount(s === "takeover" ? total : 0);
    setExpandFrom(null);
    setOrigin(null);
    setBurst(null);
    setRound((r) => r + 1);
  }

  // If the customer shortens the list while the preview sits past its end, keep things sane.
  const shown = Math.min(noCount, total);
  const g = growth(shown, total);

  /* ───────── sound: music + little effects, only ever started by a tap ───────── */
  const musicRef = useRef<Music | null>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const audioSrc = c.music.mode === "file" && c.music.audio ? media.audio[c.music.audio.assetId]?.src : undefined;
  const audioId = c.music.audio?.assetId;
  const offersSound = c.look.sounds || c.music.mode !== "none";

  const ensureMusic = useCallback(() => {
    if (c.music.mode === "none") return null;
    if (!musicRef.current) {
      if (c.music.mode === "file") {
        if (!audioSrc) return null;
        const m = createFileMusic(audioSrc);
        m.onError?.(() => {
          if (audioId) onMediaError?.(audioId);
        });
        musicRef.current = m;
      } else musicRef.current = createMusicBox();
    }
    return musicRef.current;
  }, [c.music.mode, audioSrc, audioId, onMediaError]);

  const soundUp = useCallback(() => {
    if (c.look.sounds && !sfxRef.current) sfxRef.current = createSfx();
    // Audio is a bonus: a browser without Web Audio (some in-app WebViews) must never break the page.
    try {
      const m = ensureMusic();
      if (m) void Promise.resolve(m.play()).catch(() => undefined);
    } catch {
      /* no audio here */
    }
    setSoundOn(true);
  }, [c.look.sounds, ensureMusic]);

  const toggleSound = useCallback(() => {
    if (soundOn) {
      musicRef.current?.pause();
      setSoundOn(false);
    } else soundUp();
  }, [soundOn, soundUp]);

  useEffect(() => {
    if (audioSrc && musicRef.current && !musicRef.current.demo) musicRef.current.setSrc?.(audioSrc);
  }, [audioSrc]);
  // A different song / mode (studio edits): drop the old player.
  useEffect(
    () => () => {
      musicRef.current?.destroy();
      musicRef.current = null;
      setSoundOn(false);
    },
    [c.music.mode, audioId],
  );
  useEffect(
    () => () => {
      sfxRef.current?.destroy();
      sfxRef.current = null;
    },
    [],
  );

  /* ───────── the question ───────── */
  const takeOver = useCallback(() => {
    const el = yesRef.current;
    if (el && !still) {
      const r = el.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 24;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      setExpandFrom(`inset(${Math.max(0, r.top)}px ${Math.max(0, vw - r.right)}px ${Math.max(0, vh - r.bottom)}px ${Math.max(0, r.left)}px round ${radius}px)`);
    } else setExpandFrom(null);
    setStage("takeover");
  }, [still]);

  const onNo = useCallback(() => {
    if (shown >= total) return takeOver();
    const next = shown + 1;
    if (soundOn) sfxRef.current?.no(next);
    setNoCount(next);
  }, [shown, total, takeOver, soundOn]);

  const onYes = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      // Keyboard presses report 0,0 — grow from the button's centre instead.
      const keyboard = e.detail === 0 || (e.clientX === 0 && e.clientY === 0);
      const x = keyboard ? r.left + r.width / 2 : e.clientX;
      const y = keyboard ? r.top + r.height / 2 : e.clientY;
      setOrigin({ x, y });
      setBurst({ x, y, id: Date.now() });
      // The celebration first: nothing below (audio, network) may keep them on this screen.
      setStage("finale");
      if (mode === "live" && c.responses.notify && !answered.current) {
        answered.current = true;
        onAnswer?.(shown);
      }
      // This tap is the visitor's permission: start the music if the sender asked for it.
      let sound = soundOn;
      if (!sound && c.music.playOnYes && c.music.mode !== "none") {
        soundUp();
        sound = true;
      }
      if (sound) {
        if (!sfxRef.current && c.look.sounds) sfxRef.current = createSfx();
        requestAnimationFrame(() => {
          try {
            sfxRef.current?.yes();
          } catch {
            /* no audio here */
          }
        });
      }
    },
    [c.music.playOnYes, c.music.mode, c.look.sounds, c.responses.notify, soundOn, soundUp, mode, onAnswer, shown],
  );

  const replay = useCallback(() => {
    setStage("ask");
    setNoCount(0);
    setExpandFrom(null);
    setOrigin(null);
    setBurst(null);
    setRound((r) => r + 1);
  }, []);

  // Keep keyboard / screen-reader focus with the screen that's showing.
  useEffect(() => {
    if (stage === "ask" && round > 0) questionRef.current?.focus({ preventScroll: true });
  }, [stage, round]);

  /* ───────── decoration (deterministic) ───────── */
  const ambient = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: amount.ambient }, (_, i) => ({
      left: `${(i + 0.5) * (100 / amount.ambient) + (r() - 0.5) * 8}%`,
      size: 12 + r() * 18,
      dur: 14 + r() * 12,
      delay: -r() * 20,
      sway: (r() - 0.5) * 60,
      tone: i % 3,
    }));
  }, [amount.ambient]);
  const sparkles = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: amount.sparkles }, () => ({ left: `${4 + r() * 92}%`, top: `${4 + r() * 88}%`, size: 8 + r() * 10, delay: r() * 4, dur: 2.4 + r() * 2.4 }));
  }, [amount.sparkles]);

  const vars = useMemo(() => themeVars(c.theme), [c.theme]);
  const style: Var = { ...vars, "--g": g };
  const showBuddy = c.look.character !== "none";
  const greeting = fill(c.intro.greeting);
  const message = fill(c.intro.message);

  return (
    <div className="dy" style={style} data-stage={stage} data-intensity={c.look.intensity} data-grown={shown > 0 ? "" : undefined} data-still={still ? "" : undefined} data-hydrated={hydrated ? "" : undefined}>
      <div className="dy-backdrop" aria-hidden="true">
        <div className="dy-glow dy-glow-a" />
        <div className="dy-glow dy-glow-b" />
        {!still &&
          ambient.map((h, i) => (
            <span key={i} className={`dy-drift dy-tone-${h.tone}`} style={{ left: h.left, "--s": `${h.size}px`, "--dur": `${h.dur}s`, "--delay": `${h.delay}s`, "--sway": `${h.sway}px` } as Var}>
              <Heart />
            </span>
          ))}
        {sparkles.map((s, i) => (
          <span key={i} className="dy-twinkle" style={{ left: s.left, top: s.top, "--s": `${s.size}px`, "--delay": `${s.delay}s`, "--dur": `${s.dur}s` } as Var}>
            <Sparkle />
          </span>
        ))}
      </div>

      {mode === "preview" && <p className="dy-ribbon">Preview</p>}

      {offersSound && (
        <button type="button" className="dy-sound" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Turn sound off" : "Turn sound on"} data-testid="dy-sound">
          <SoundIcon on={soundOn} />
        </button>
      )}

      {/* ───────── screen 1–2: the question ───────── */}
      <main className="dy-stage" inert={stage !== "ask"} aria-hidden={stage !== "ask" ? true : undefined}>
        <section key={round} className="dy-card" aria-labelledby="dy-question">
          {greeting && (
            <p className="dy-greeting dy-in" style={{ "--i": 0 } as Var}>
              {greeting}
            </p>
          )}
          {message && (
            <p className="dy-intro dy-in" style={{ "--i": 1 } as Var}>
              {message}
            </p>
          )}
          <h1 id="dy-question" ref={questionRef} tabIndex={-1} className="dy-question dy-in" style={{ "--i": 2 } as Var}>
            {fill(c.question.text)}
          </h1>
          {showBuddy && (
            <div className="dy-buddy-wrap dy-in" style={{ "--i": 3 } as Var}>
              <Buddy kind={c.look.character as Exclude<typeof c.look.character, "none">} mood={moodFor(shown, total)} className="dy-buddy" />
            </div>
          )}
          <div className="dy-choices dy-in" style={{ "--i": 4 } as Var}>
            <button ref={yesRef} type="button" className="dy-yes" onClick={onYes} data-testid="dy-yes">
              <span className="dy-yes-label">{fill(c.question.yesText)}</span>
            </button>
            <button type="button" className="dy-no" onClick={onNo} data-testid="dy-no" data-count={shown}>
              <span key={shown} className="dy-no-label">
                {fill(noLabel(c, shown))}
              </span>
            </button>
          </div>
          <p className="dy-sr" aria-live="polite">
            {shown > 0 ? fill(noLabel(c, shown)) : ""}
          </p>
        </section>
      </main>

      {/* ───────── screen 3: Yes fills the screen ───────── */}
      {stage === "takeover" && <Takeover from={expandFrom} still={still} text={fill(c.question.yesText)} hint={fill(c.question.takeoverHint)} onYes={onYes} amount={amount.ambient} />}

      {/* ───────── screen 4: the finale ───────── */}
      {stage === "finale" && <Finale c={c} fill={fill} origin={origin} still={still} media={media} onMediaError={onMediaError} replay={replay} mode={mode} intensity={c.look.intensity} />}

      {burst && !still && <Burst key={burst.id} x={burst.x} y={burst.y} count={amount.burst} />}
    </div>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
      {on ? (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </g>
      )}
    </svg>
  );
}

/** The Yes button grows out of its own box until it is the whole screen. */
function Takeover({ from, still, text, hint, onYes, amount }: { from: string | null; still: boolean; text: string; hint: string; onYes: (e: ReactMouseEvent<HTMLElement>) => void; amount: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [full, setFull] = useState(from === null);

  useLayoutEffect(() => {
    if (full) return;
    // Paint the start shape once, then let the transition carry it to full screen.
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setFull(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [full]);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), still ? 0 : EXPAND_MS * 0.6);
    return () => clearTimeout(t);
  }, [still]);

  const hearts = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: Math.max(6, amount) }, () => ({ left: `${r() * 100}%`, size: 14 + r() * 26, dur: 7 + r() * 7, delay: -r() * 10, sway: (r() - 0.5) * 50 }));
  }, [amount]);

  const clip = full ? "inset(0px 0px 0px 0px round 0px)" : (from ?? undefined);
  return (
    <button
      ref={ref}
      type="button"
      className="dy-takeover"
      data-full={full ? "" : undefined}
      style={{ clipPath: clip, WebkitClipPath: clip }}
      onClick={onYes}
      aria-label={text}
      data-testid="dy-takeover"
    >
      <span className="dy-takeover-light" aria-hidden="true" />
      {!still &&
        hearts.map((h, i) => (
          <span key={i} aria-hidden="true" className="dy-drift dy-drift-light" style={{ left: h.left, "--s": `${h.size}px`, "--dur": `${h.dur}s`, "--delay": `${h.delay}s`, "--sway": `${h.sway}px` } as Var}>
            <Heart />
          </span>
        ))}
      <span className="dy-takeover-inner" aria-hidden="true">
        <span className="dy-takeover-ring" />
        <span className="dy-takeover-text">{text}</span>
        {hint && <span className="dy-takeover-hint">{hint}</span>}
      </span>
    </button>
  );
}

/** Little hearts flying out of the spot they tapped. */
function Burst({ x, y, count }: { x: number; y: number; count: number }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(t);
  }, []);
  const parts = useMemo(() => {
    const r = rng(Math.round(x * 31 + y * 17));
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.4;
      const d = 70 + r() * 90;
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 30, size: 14 + r() * 14, tone: i % 3, rot: (r() - 0.5) * 70 };
    });
  }, [x, y, count]);
  if (done) return null;
  return (
    <div className="dy-burst" style={{ left: x, top: y }} aria-hidden="true">
      {parts.map((p, i) => (
        <span key={i} className={`dy-burst-heart dy-tone-${p.tone}`} style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--s": `${p.size}px`, "--rot": `${p.rot}deg` } as Var}>
          <Heart />
        </span>
      ))}
    </div>
  );
}

const CONFETTI_COLORS = ["var(--dy-accent)", "var(--dy-gold)", "var(--dy-heart-2)", "var(--dy-yes-hi)", "#ffffff"];

function Finale({
  c,
  fill,
  origin,
  still,
  media,
  onMediaError,
  replay,
  mode,
  intensity,
}: {
  c: AskContent;
  fill: (s: string) => string;
  origin: { x: number; y: number } | null;
  still: boolean;
  media: MediaMap;
  onMediaError?: (assetId: string) => void;
  replay: () => void;
  mode: RenderMode;
  intensity: Intensity;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState(origin === null || still);
  const amount = AMOUNT[intensity];

  useLayoutEffect(() => {
    if (open) return;
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => headingRef.current?.focus({ preventScroll: true }), still ? 0 : REVEAL_MS * 0.5);
    return () => clearTimeout(t);
  }, [still]);

  const confetti = useMemo(() => {
    const r = rng(41);
    return Array.from({ length: amount.confetti }, (_, i) => ({
      left: `${r() * 100}%`,
      w: 6 + r() * 7,
      h: r() > 0.35 ? 10 + r() * 8 : 6 + r() * 7,
      round: r() > 0.7,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      delay: 0.25 + r() * 0.9,
      dur: 2.8 + r() * 2.2,
      drift: (r() - 0.5) * 140,
      spin: 360 + r() * 720,
    }));
  }, [amount.confetti]);
  const rising = useMemo(() => {
    const r = rng(53);
    return Array.from({ length: amount.rising }, (_, i) => ({ left: `${r() * 100}%`, size: 14 + r() * 22, dur: 6 + r() * 6, delay: 0.6 + r() * 6, sway: (r() - 0.5) * 70, tone: i % 3 }));
  }, [amount.rising]);

  const photoId = c.finale.photo?.assetId;
  const photo = photoId ? media.images[photoId] : undefined;
  const showBuddy = c.look.character !== "none";
  const clip = open ? `circle(150% at ${origin ? `${origin.x}px ${origin.y}px` : "50% 50%"})` : `circle(0px at ${origin!.x}px ${origin!.y}px)`;
  const message = fill(c.finale.message);
  const signature = fill(c.finale.signature);
  const subheading = fill(c.finale.subheading);

  return (
    <section className="dy-finale" data-open={open ? "" : undefined} style={{ clipPath: clip, WebkitClipPath: clip }} aria-labelledby="dy-finale-title" data-testid="dy-finale">
      <div className="dy-finale-bg" aria-hidden="true" />
      {!still && (
        <div className="dy-confetti" aria-hidden="true">
          {confetti.map((p, i) => (
            <span
              key={i}
              style={{ left: p.left, width: p.w, height: p.h, borderRadius: p.round ? "50%" : 2, background: p.color, "--delay": `${p.delay}s`, "--dur": `${p.dur}s`, "--drift": `${p.drift}px`, "--spin": `${p.spin}deg` } as Var}
            />
          ))}
        </div>
      )}
      {!still && (
        <div className="dy-rising" aria-hidden="true">
          {rising.map((h, i) => (
            <span key={i} className={`dy-rise dy-tone-${h.tone}`} style={{ left: h.left, "--s": `${h.size}px`, "--dur": `${h.dur}s`, "--delay": `${h.delay}s`, "--sway": `${h.sway}px` } as Var}>
              <Heart />
            </span>
          ))}
        </div>
      )}

      <div className="dy-finale-inner">
        <div className="dy-finale-art">
          {photo ? (
            <figure className="dy-polaroid">
              <img src={photo.src} srcSet={photo.srcSet} sizes="(max-width: 600px) 62vw, 260px" alt="" onError={() => photoId && onMediaError?.(photoId)} />
              <span className="dy-polaroid-heart" aria-hidden="true">
                <Heart />
              </span>
              {showBuddy && <Buddy kind={c.look.character as Exclude<typeof c.look.character, "none">} mood="happy" className="dy-buddy dy-buddy-peek" />}
            </figure>
          ) : (
            showBuddy && <Buddy kind={c.look.character as Exclude<typeof c.look.character, "none">} mood="happy" className="dy-buddy dy-buddy-happy" />
          )}
        </div>
        <h2 id="dy-finale-title" ref={headingRef} tabIndex={-1} className="dy-finale-title">
          {fill(c.finale.heading)}
        </h2>
        {subheading && <p className="dy-finale-sub">{subheading}</p>}
        {(message || signature) && (
          <div className="dy-letter">
            {message && <p className="dy-letter-body">{message}</p>}
            {signature && <p className="dy-letter-sign">{signature}</p>}
          </div>
        )}
        <div className="dy-finale-actions">
          {c.finale.replay && (
            <button type="button" className="dy-replay" onClick={replay} data-testid="dy-replay">
              <span aria-hidden="true">↺</span> Ask me again
            </button>
          )}
        </div>
        {mode === "live" && c.responses.notify && c.people.senderName && <p className="dy-note">{c.people.senderName} will know you said yes ♡</p>}
      </div>
    </section>
  );
}
