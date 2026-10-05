"use client";

import "./fonts/fonts.css";
import "./scrapbook.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Ctx, makeFill, type ExperienceCtx, type LiftState, type RenderMode, type ResolvedImage, type SceneId } from "./context";
import { createConfetti, createTimers, hearts, popAt as popAtEl } from "./engine/effects";
import { createFileMusic, createMusicBox, type Music } from "./engine/music";
import { themeVars } from "./engine/theme";
import type { ScrapbookContent } from "./schema";
import { Cover } from "./scenes/Cover";
import { Quiz } from "./scenes/Quiz";
import { Menu } from "./scenes/Menu";
import { Letter } from "./scenes/Letter";
import { Memories, PhotoLift } from "./scenes/Memories";
import { CouponLift, Coupons } from "./scenes/Coupons";
import { Song, type SongControls } from "./scenes/Song";
import { Surprise } from "./scenes/Surprise";
import { Final } from "./scenes/Final";

export type MediaMap = {
  images: Record<string, ResolvedImage>;
  audio: Record<string, { src: string }>;
};

export type ExperienceProps = {
  content: ScrapbookContent;
  mode: RenderMode;
  media: MediaMap;
  /** Namespaces browser storage per site so one site's state never shows on another. */
  storageKey: string;
  onMediaError?: (assetId: string) => void;
};

const SCENES: { id: SceneId; bg: string }[] = [
  { id: "cover", bg: "bg-gingham" },
  { id: "quiz", bg: "bg-lavcheck" },
  { id: "menu", bg: "bg-dots" },
  { id: "letter", bg: "bg-blush" },
  { id: "memories", bg: "bg-graph" },
  { id: "coupons", bg: "bg-stripes" },
  { id: "song", bg: "bg-lavcheck" },
  { id: "surprise", bg: "bg-gingham" },
  { id: "final", bg: "bg-rose" },
];

const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function readUsed(key: string | null): Set<number> {
  if (!key) return new Set();
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

export function Experience({ content: c, mode, media, storageKey, onMediaError }: ExperienceProps) {
  const appRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefs = useRef<Partial<Record<SceneId, HTMLElement | null>>>({});
  const liftRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const navigated = useRef(false);
  const liftOpener = useRef<HTMLElement | null>(null);
  const confettiRef = useRef<ReturnType<typeof createConfetti> | null>(null);
  const timers = useMemo(() => createTimers(prefersReducedMotion), []);

  const [current, setCurrent] = useState<SceneId>("cover");
  const [visits, setVisits] = useState<Record<SceneId, number>>({ cover: 1, quiz: 0, menu: 0, letter: 0, memories: 0, coupons: 0, song: 0, surprise: 0, final: 0 });
  const [lift, setLiftState] = useState<LiftState>(null);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  // Coupon state lives in browser storage only for the recipient's page, namespaced per site.
  const usedKey = mode === "live" ? `bday:${storageKey}:coupons` : null;
  const [usedCoupons, setUsedCoupons] = useState<Set<number>>(() => new Set());
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    // Restoring persisted coupon state after mount keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsedCoupons(readUsed(usedKey));
  }, [usedKey]);

  useEffect(() => {
    // Lets tests (and the editor) know event handlers are attached.
    appRef.current?.setAttribute("data-hydrated", "");
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !appRef.current) return;
    confettiRef.current = createConfetti(canvasRef.current, appRef.current);
    return () => confettiRef.current?.destroy();
  }, []);

  useEffect(() => () => timers.clear(), [timers]);

  const fill = useMemo(() => makeFill(c), [c]);
  const appEl = useCallback(() => appRef.current, []);
  const popAt = useCallback((el: Element | null, n?: number) => {
    if (prefersReducedMotion() || !appRef.current) return;
    popAtEl(appRef.current, el, n);
  }, []);
  const confetti = useCallback((n?: number, ox?: number, oy?: number) => {
    if (prefersReducedMotion()) return;
    confettiRef.current?.burst(n, ox, oy);
  }, []);
  const riseHearts = useCallback(
    (n: number) => {
      if (prefersReducedMotion() || !appRef.current) return;
      hearts(appRef.current, timers, n);
    },
    [timers],
  );

  const setLift = useCallback((l: LiftState) => {
    if (l && !liftOpener.current) liftOpener.current = document.activeElement as HTMLElement | null;
    if (!l) {
      const back = liftOpener.current;
      liftOpener.current = null;
      if (back && document.contains(back)) back.focus({ preventScroll: true });
    }
    setLiftState(l);
  }, []);

  /* ───────── scene router with a paper "page turn" ───────── */
  const show = useCallback(
    (id: SceneId) => {
      timers.clear();
      liftOpener.current = null;
      setLiftState(null);
      navigated.current = true;
      setCurrent(id);
      setVisits((v) => ({ ...v, [id]: v[id] + 1 }));
    },
    [timers],
  );

  const go = useCallback(
    (id: SceneId) => {
      if (busy.current) return;
      if (prefersReducedMotion()) {
        show(id);
        return;
      }
      busy.current = true;
      const wipe = wipeRef.current;
      if (wipe) {
        wipe.classList.remove("run");
        void wipe.offsetWidth;
        wipe.classList.add("run");
      }
      window.setTimeout(() => show(id), 430);
      window.setTimeout(() => {
        wipe?.classList.remove("run");
        busy.current = false;
      }, 960);
    },
    [show],
  );

  // On every scene entry: scroll to top, move focus into the scene and announce it.
  useLayoutEffect(() => {
    const sc = sceneRefs.current[current];
    if (!sc) return;
    sc.scrollTop = 0;
    if (navigated.current) {
      sc.focus({ preventScroll: true });
      const label = sc.getAttribute("aria-label") ?? "";
      setAnnounce(label);
    }
  }, [current, visits]);

  const onAppClick = (e: React.MouseEvent) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-go]");
    if (b && appRef.current?.contains(b)) {
      popAt(b, 6);
      go(b.dataset.go as SceneId);
    }
  };

  // Escape closes the lifted overlay; Tab is kept inside it while it is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLift(null);
      if (e.key === "Tab" && lift && liftRef.current) {
        const f = [...liftRef.current.querySelectorAll<HTMLElement>("button")];
        if (!f.length) return;
        const first = f[0]!,
          last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!liftRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [lift, setLift]);

  useEffect(() => {
    if (lift && liftRef.current) liftRef.current.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
  }, [lift]);

  /* ───────── music (lives here so it keeps playing across scenes) ───────── */
  const audioId = c.song.audio?.assetId ?? null;
  const audioSrc = audioId ? media.audio[audioId]?.src ?? null : null;
  const musicRef = useRef<Music | null>(null);
  const musicKind = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [songError, setSongError] = useState(false);

  const getMusic = useCallback((): Music => {
    const kind = audioId ?? "musicbox";
    if (!musicRef.current || musicKind.current !== kind) {
      musicRef.current?.destroy();
      musicRef.current = audioSrc ? createFileMusic(audioSrc) : createMusicBox();
      musicRef.current.onError?.(() => {
        if (audioId) onMediaError?.(audioId);
      });
      musicKind.current = kind;
    }
    return musicRef.current;
  }, [audioId, audioSrc, onMediaError]);

  // A refreshed signed URL for the same track: swap the source, keep the position.
  useEffect(() => {
    if (audioSrc && musicRef.current && musicKind.current === audioId) musicRef.current.setSrc?.(audioSrc);
  }, [audioSrc, audioId]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && musicRef.current) {
        musicRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      musicRef.current?.destroy();
      musicRef.current = null;
    };
  }, []);

  const song: SongControls = useMemo(
    () => ({
      playing,
      error: songError,
      isMusicBox: !audioSrc,
      music: getMusic,
      async toggle(btn) {
        const m = getMusic();
        if (playing) {
          m.pause();
          setPlaying(false);
          return;
        }
        try {
          await m.play();
          setSongError(false);
          setPlaying(true);
          popAt(btn, 8);
        } catch {
          setSongError(true);
          if (audioId) onMediaError?.(audioId);
        }
      },
    }),
    [playing, songError, audioSrc, getMusic, popAt, audioId, onMediaError],
  );

  const ctx: ExperienceCtx = {
    c,
    mode,
    fill,
    image: (id) => media.images[id] ?? null,
    reportMediaError: (id) => onMediaError?.(id),
    reduced: prefersReducedMotion,
    timers,
    popAt,
    confetti,
    riseHearts,
    appEl,
    sceneEl: (id) => sceneRefs.current[id] ?? null,
    go,
    lift,
    setLift,
    opened,
    markOpened: (card) => setOpened((s) => new Set(s).add(card)),
    usedCoupons,
    toggleCoupon: (i) =>
      setUsedCoupons((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        if (usedKey)
          try {
            localStorage.setItem(usedKey, JSON.stringify([...next]));
          } catch {
            /* storage unavailable: state just isn't remembered */
          }
        return next;
      }),
  };

  const sceneLabel: Record<SceneId, string> = {
    cover: fill(c.cover.titleTop) + " " + c.recipientName,
    quiz: "Questions",
    menu: fill(c.menuTitle),
    letter: fill(c.cards.letter),
    memories: fill(c.cards.memories),
    coupons: fill(c.cards.coupons),
    song: fill(c.cards.song),
    surprise: fill(c.cards.gift),
    final: fill(c.final.heading),
  };

  const body = (id: SceneId) => {
    const k = visits[id];
    // Scenes are built on first visit (hidden scenes are display:none, so nothing visible
    // changes); this keeps the first load and hydration down to the cover.
    if (k === 0 && current !== id) return null;
    switch (id) {
      case "cover": return <Cover key={k} />;
      case "quiz": return <Quiz key={k} />;
      case "menu": return <Menu key={k} />;
      case "letter": return <Letter key={k} />;
      case "memories": return <Memories key={k} />;
      case "coupons": return <Coupons key={k} />;
      case "song": return <Song key={k} controls={song} active={current === "song"} />;
      case "surprise": return <Surprise key={k} />;
      case "final": return <Final key={k} active={current === "final"} onRestart={() => setOpened(new Set())} />;
    }
  };

  return (
    <Ctx.Provider value={ctx}>
      <div id="app" ref={appRef} onClick={onAppClick} style={themeVars(c.theme) as CSSProperties}>
        {SCENES.map(({ id, bg }) => (
          <section
            key={id}
            className={`scene ${bg}${current === id ? " on" : ""}`}
            id={id}
            ref={(el) => {
              sceneRefs.current[id] = el;
            }}
            tabIndex={-1}
            aria-label={sceneLabel[id]}
            aria-hidden={current === id ? undefined : true}
          >
            {body(id)}
          </section>
        ))}
        <div
          className={`lift${lift ? " on" : ""}`}
          id="lift"
          role="dialog"
          aria-modal="true"
          aria-label={lift?.type === "coupon" ? "Coupon" : "Photo"}
          ref={liftRef}
          onClick={(e) => {
            if (e.target === e.currentTarget || (e.target as Element).closest("[data-close]")) setLift(null);
          }}
        >
          {lift?.type === "photo" && <PhotoLift key={`p${lift.i}`} i={lift.i} />}
          {lift?.type === "coupon" && <CouponLift key={`c${lift.i}`} i={lift.i} />}
        </div>
        <canvas id="confetti" ref={canvasRef} aria-hidden="true" />
        <div className="wipe" id="wipe" ref={wipeRef} aria-hidden="true">
          <span>♡</span>
        </div>
        {mode === "preview" && <div className="preview-ribbon">PREVIEW · only you can see this</div>}
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </Ctx.Provider>
  );
}
