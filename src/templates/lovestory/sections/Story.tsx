"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "../art";
import { useLove } from "../context";
import { Btn, NavRow, Paper, Photo, Polaroid, StepTitle } from "../parts";
import { formatDate, Lines } from "../text";
import { NightScene } from "./Night";

/** 8. "You did it!" — the envelope opens, then the story begins. */
export function Unlock() {
  const { c, fill, next, still, burst } = useLove();
  const u = c.unlock;
  const [open, setOpen] = useState(false);
  const env = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return (
    <NightScene couple={false} className="lu-unlock">
      {u.photo && (
        <div className="lu-unlock-photo">
          <Polaroid media={u.photo} seed={4} tilt={-7} sizes="200px" />
        </div>
      )}
      <StepTitle className="lu-hero lu-glow-text">{fill(u.title)}</StepTitle>
      {u.message && (
        <p className="lu-hero-sub">
          <Lines text={fill(u.message)} />
        </p>
      )}
      <div ref={env} className={`lu-envelope ${open ? "open" : ""}`} aria-hidden="true">
        <span className="lu-env-back" />
        <span className="lu-env-letter">
          <Heart />
        </span>
        <span className="lu-env-front" />
        <span className="lu-env-flap" />
        <span className="lu-env-seal">
          <Heart />
        </span>
      </div>
      <Btn
        variant="glow"
        disabled={open}
        onClick={() => {
          setOpen(true);
          burst(env.current, 16);
          timer.current = window.setTimeout(next, still ? 0 : 1300);
        }}
      >
        {fill(u.button)} <span aria-hidden="true">→</span>
      </Btn>
    </NightScene>
  );
}

/** 9. Our story timeline. */
export function Timeline() {
  const { c, fill } = useLove();
  const t = c.timeline;
  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-timeline-paper">
        <StepTitle>{fill(t.title)}</StepTitle>
        {t.subtitle && <p className="lu-subtitle">{fill(t.subtitle)}</p>}
        <ol className="lu-timeline">
          {t.events.map((e, i) => (
            <li key={e.id} className={`lu-tl-item ${i % 2 ? "right" : "left"}`}>
              <span className="lu-tl-node" aria-hidden="true">
                <Heart />
              </span>
              <div className="lu-tl-card">
                {e.date && (
                  <p className="lu-tl-date">
                    <time dateTime={e.date}>{formatDate(e.date)}</time>
                  </p>
                )}
                <h2 className="lu-tl-title">{fill(e.title)}</h2>
                {e.description && (
                  <p className="lu-tl-desc">
                    <Lines text={fill(e.description)} />
                  </p>
                )}
              </div>
              {e.photo && (
                <div className="lu-tl-photo">
                  <Polaroid media={e.photo} seed={i} tilt={i % 2 ? 4 : -4} sizes="(max-width: 640px) 60vw, 220px" />
                </div>
              )}
            </li>
          ))}
        </ol>
        <NavRow />
      </Paper>
    </div>
  );
}

/** 10. Scrapbook with category filters and a lightbox. */
export function Scrapbook() {
  const { c, fill } = useLove();
  const s = c.scrapbook;
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);
  const used = new Set(s.photos.map((p) => p.category));
  const cats = s.categories.filter((k) => used.has(k.id));
  const shown = s.photos.map((p, i) => ({ p, i })).filter(({ p }) => filter === "all" || p.category === filter);
  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-scrap-paper">
        <StepTitle>{fill(s.title)}</StepTitle>
        {s.subtitle && <p className="lu-subtitle">{fill(s.subtitle)}</p>}
        {cats.length > 0 && (
          <div className="lu-chips" role="group" aria-label="Filter photos">
            <button type="button" className={`lu-chip ${filter === "all" ? "on" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All
            </button>
            {cats.map((k) => (
              <button key={k.id} type="button" className={`lu-chip ${filter === k.id ? "on" : ""}`} aria-pressed={filter === k.id} onClick={() => setFilter(k.id)}>
                {fill(k.label)}
              </button>
            ))}
          </div>
        )}
        <ul className="lu-scrap-grid">
          {shown.map(({ p, i }) => (
            <li key={p.id}>
              <button type="button" className="lu-scrap-item" onClick={() => setOpen(i)} aria-label={`Open photo${p.caption ? `: ${fill(p.caption)}` : ""}`}>
                <Polaroid media={p.image} caption={fill(p.caption)} date={p.date ? formatDate(p.date) : undefined} seed={i} tilt={((i * 7) % 9) - 4} tape={i % 3 !== 1} sizes="(max-width: 640px) 45vw, 240px" />
              </button>
            </li>
          ))}
          {s.note && (
            <li className="lu-scrap-note" aria-hidden={false}>
              <p className="lu-hand">
                <Lines text={fill(s.note)} />
              </p>
            </li>
          )}
        </ul>
        {shown.length === 0 && <p className="lu-empty">No photos in this one yet ♡</p>}
        <NavRow />
      </Paper>
      {open !== null && s.photos[open] && <Lightbox index={open} onClose={() => setOpen(null)} onMove={(d) => setOpen((o) => (o === null ? null : (o + d + s.photos.length) % s.photos.length))} />}
    </div>
  );
}

function Lightbox({ index, onClose, onMove }: { index: number; onClose: () => void; onMove: (d: number) => void }) {
  const { c, fill } = useLove();
  const p = c.scrapbook.photos[index]!;
  const closeBtn = useRef<HTMLButtonElement>(null);
  const handlers = useRef({ onClose, onMove });
  useEffect(() => {
    handlers.current = { onClose, onMove };
  });
  useEffect(() => {
    // Runs once per opening: remember what opened it, trap nothing, restore focus on close.
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.onClose();
      if (e.key === "ArrowRight") handlers.current.onMove(1);
      if (e.key === "ArrowLeft") handlers.current.onMove(-1);
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div className="lu-lightbox" role="dialog" aria-modal="true" aria-label={fill(p.caption) || "Photo"} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <figure className="lu-lightbox-card">
        <Photo media={p.image} alt={fill(p.caption) || "A photo of us"} seed={index} sizes="(max-width: 900px) 92vw, 820px" eager />
        <figcaption>
          {p.caption && <span className="lu-hand">{fill(p.caption)}</span>}
          {p.date && <span className="lu-date">{formatDate(p.date)}</span>}
        </figcaption>
      </figure>
      <div className="lu-lightbox-nav">
        {c.scrapbook.photos.length > 1 && (
          <Btn variant="ghost" onClick={() => onMove(-1)} label="Previous photo">
            ←
          </Btn>
        )}
        <button ref={closeBtn} type="button" className="lu-btn lu-btn-primary" onClick={onClose}>
          Close ♡
        </button>
        {c.scrapbook.photos.length > 1 && (
          <Btn variant="ghost" onClick={() => onMove(1)} label="Next photo">
            →
          </Btn>
        )}
      </div>
    </div>
  );
}
