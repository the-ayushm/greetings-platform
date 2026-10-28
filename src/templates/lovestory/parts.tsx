"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Flowers, Heart, SceneArt, Sparkle } from "./art";
import { useLove } from "./context";
import type { MediaRef } from "./schema";

/** A customer photo (signed, pre-resized WebP) with an illustrated fallback if it's missing. */
export function Photo({ media, alt, seed = 0, sizes = "(max-width: 640px) 80vw, 360px", eager, className }: { media: MediaRef; alt: string; seed?: number; sizes?: string; eager?: boolean; className?: string }) {
  const { image, reportMediaError, mode } = useLove();
  const [failed, setFailed] = useState(false);
  const img = media ? image(media.assetId) : null;
  const src = img?.src;
  useEffect(() => {
    // A refreshed signed URL gets a fresh chance.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailed(false);
  }, [src]);
  if (!img || failed) {
    return <SceneArt seed={seed} className={`lu-photo lu-photo-ph ${className ?? ""}`} label={mode === "preview" && !media ? "Your photo goes here" : alt || undefined} />;
  }
  return (
    <img
      className={`lu-photo ${className ?? ""}`}
      src={img.src}
      srcSet={img.srcSet}
      sizes={img.srcSet ? sizes : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => {
        setFailed(true);
        if (media) reportMediaError(media.assetId);
      }}
    />
  );
}

export function Polaroid({ media, caption, date, seed, tilt = 0, tape = true, className, sizes, eager }: { media: MediaRef; caption?: string; date?: string; seed?: number; tilt?: number; tape?: boolean; className?: string; sizes?: string; eager?: boolean }) {
  return (
    <figure className={`lu-polaroid ${className ?? ""}`} style={{ "--tilt": `${tilt}deg` } as CSSProperties}>
      {tape && <span className="lu-tape" aria-hidden="true" />}
      <div className="lu-polaroid-img">
        <Photo media={media} alt={caption || "A photo of us"} seed={seed} sizes={sizes} eager={eager} />
      </div>
      {(caption || date) && (
        <figcaption>
          {caption && <span className="lu-hand">{caption}</span>}
          {date && <span className="lu-date">{date}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** Cream paper card used by the "paper" scenes. */
export function Paper({ children, className, flowers = true }: { children: ReactNode; className?: string; flowers?: boolean }) {
  return (
    <div className={`lu-paper ${className ?? ""}`}>
      {flowers && <Flowers className="lu-flowers lu-flowers-br" />}
      {flowers && <Flowers className="lu-flowers lu-flowers-tl" flip />}
      <span className="lu-heart-deco lu-hd1" aria-hidden="true">
        <Heart filled={false} />
      </span>
      <span className="lu-heart-deco lu-hd2" aria-hidden="true">
        <Heart />
      </span>
      {children}
    </div>
  );
}

/** Heading that receives focus when its step opens (screen readers announce the new page). */
export function StepTitle({ children, className, as: Tag = "h1" }: { children: ReactNode; className?: string; as?: "h1" | "h2" }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  // Titles the customer already ended with a heart don't get a second one.
  const ownHeart = typeof children === "string" && /[♡♥❤💕💖💗💓]\s*$/u.test(children);
  return (
    <Tag ref={ref} tabIndex={-1} className={`lu-title ${className ?? ""}`}>
      {children}
      {!ownHeart && <Heart className="lu-title-heart" filled={false} />}
    </Tag>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, className, type = "button", label }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "glow"; disabled?: boolean; className?: string; type?: "button" | "submit"; label?: string }) {
  return (
    <button type={type} className={`lu-btn lu-btn-${variant} ${className ?? ""}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

/** Back / progress / Next row shared by the paper scenes. */
export function NavRow({ canNext = true, nextLabel, onNext, extra }: { canNext?: boolean; nextLabel?: string; onNext?: () => void; extra?: ReactNode }) {
  const { next, back, stepIndex, c, fill } = useLove();
  return (
    <div className="lu-nav">
      {stepIndex > 0 ? (
        <Btn variant="ghost" onClick={back}>
          {fill(c.copy.back)}
        </Btn>
      ) : (
        <span />
      )}
      {extra}
      <Btn onClick={onNext ?? next} disabled={!canNext}>
        {nextLabel ?? fill(c.copy.next)} <span aria-hidden="true">→</span>
      </Btn>
    </div>
  );
}

/** Ambient floating hearts and sparkles (CSS animation; fixed positions so SSR matches). */
export function Ambient({ hearts, sparkles }: { hearts: number; sparkles: boolean }) {
  return (
    <div className="lu-ambient" aria-hidden="true">
      {Array.from({ length: hearts }, (_, i) => (
        <span key={i} className="lu-float" style={{ left: `${(i * 37 + 11) % 97}%`, animationDelay: `${(i * 1.7) % 11}s`, animationDuration: `${11 + ((i * 3) % 8)}s`, fontSize: `${12 + ((i * 5) % 14)}px` }}>
          <Heart />
        </span>
      ))}
      {sparkles &&
        Array.from({ length: 10 }, (_, i) => (
          <span key={`s${i}`} className="lu-spark" style={{ left: `${(i * 29 + 7) % 95}%`, top: `${(i * 43 + 5) % 90}%`, animationDelay: `${(i * 0.9) % 4}s` }}>
            <Sparkle />
          </span>
        ))}
    </div>
  );
}

/** "1/5" with heart dots. */
export function QuestionProgress({ index, total }: { index: number; total: number }) {
  return (
    <div className="lu-qprogress" aria-label={`Question ${index + 1} of ${total}`}>
      <span className="lu-qcount">
        {index + 1}/{total}
      </span>
      <span className="lu-qdots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <Heart key={i} className={i <= index ? "on" : ""} filled={i <= index} />
        ))}
      </span>
    </div>
  );
}
