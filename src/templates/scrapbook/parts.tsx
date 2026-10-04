"use client";

import { useId, useState, type CSSProperties } from "react";
import type { MediaRef } from "./schema";
import { useExperience } from "./context";

const skies = [
  ["#cfe6ff", "#ffe3ee", "#f7b6cb", "#fbd0de", "#fff6c9"],
  ["#e6d9ff", "#ffd9e6", "#d9c2f5", "#ecdcff", "#ffffff"],
  ["#ffd6c9", "#ffe9d6", "#f59ab8", "#fbc3d4", "#fff1b8"],
  ["#d8f0ff", "#f3e9ff", "#c9b4ee", "#e2d2fb", "#ffffff"],
  ["#ffc9da", "#fff0e0", "#e9788f", "#f7aec2", "#fff6c9"],
  ["#dfe9ff", "#ffe6f0", "#f3a9bf", "#ffd3e0", "#ffffff"],
] as const;

/** illustrated placeholder "photo" (used when no image was chosen) */
export function Placeholder({ i }: { i: number }) {
  const id = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [a, b, h1, h2, sun] = skies[i % skies.length]!;
  const m = i % 4;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      <circle cx={28 + ((i * 17) % 46)} cy={40 + ((i * 7) % 14)} r="13" fill={sun} opacity=".85" />
      {m === 0 && <path d="M70 26c-5-8-16-2-12 6 3 6 12 10 12 10s9-4 12-10c4-8-7-14-12-6z" fill="#fff" opacity=".9" />}
      {m === 1 && (
        <g fill="#fff">
          <path d="M22 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M78 30l1.4 3.6 3.6 1.4-3.6 1.4L78 40l-1.4-3.6L73 35l3.6-1.4z" />
          <circle cx="52" cy="14" r="1.6" />
        </g>
      )}
      {m === 2 && (
        <g fill="#fff" opacity=".95">
          <ellipse cx="30" cy="30" rx="14" ry="6" />
          <ellipse cx="38" cy="26" rx="9" ry="6" />
          <ellipse cx="76" cy="42" rx="11" ry="4.5" />
        </g>
      )}
      {m === 3 && <path d="M74 14a14 14 0 1 0 10 22 11 11 0 0 1-10-22z" fill="#fff" opacity=".95" />}
      <path d="M0 74c16-12 30-12 46-2s34 8 54-6v34H0z" fill={h2} />
      <path d="M0 86c20-10 38-8 56-1s30 4 44-3v18H0z" fill={h1} />
    </svg>
  );
}

/** A square photo with the orange digicam date stamp, or the illustrated placeholder. */
export function Photo({ media, i, alt, sizes }: { media: MediaRef; i: number; alt?: string; sizes?: string }) {
  const { c, image, mode, reportMediaError } = useExperience();
  const resolved = media ? image(media.assetId) : null;
  const [failed, setFailed] = useState<string | null>(null);
  const ds = c.photoDateStamp ? <span className="ds">{c.photoDateStamp}</span> : null;
  if (resolved && failed !== resolved.src) {
    return (
      <span className="ph">
        <img
          src={resolved.src}
          srcSet={resolved.srcSet}
          sizes={sizes ?? "(min-width: 768px) 400px, 60vw"}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailed(resolved.src);
            if (media) reportMediaError(media.assetId);
          }}
        />
        {ds}
      </span>
    );
  }
  return (
    <span className="ph">
      <Placeholder i={i} />
      {mode !== "live" && <span className="note">your photo</span>}
      {ds}
    </span>
  );
}

export function Bow({ c = "var(--red)" }: { c?: string }) {
  return (
    <svg className="sticker" viewBox="0 0 80 54" aria-hidden="true">
      <g fill={c}>
        <path d="M38 24C28 8 8 2 5 10c-3 9 0 24 6 28 7 4 22-4 27-14z" />
        <path d="M42 24C52 8 72 2 75 10c3 9 0 24-6 28-7 4-22-4-27-14z" />
        <path d="M36 28c-4 8-10 18-14 24l9-3 3 4c3-7 6-16 7-24z" />
        <path d="M44 28c4 8 10 18 14 24l-9-3-3 4c-3-7-6-16-7-24z" />
      </g>
      <rect x="33" y="17" width="14" height="15" rx="5" fill={c} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function Digicam() {
  return (
    <svg className="sticker" viewBox="0 0 96 64" aria-hidden="true">
      <rect x="3" y="12" width="90" height="49" rx="9" fill="#e9dcfb" />
      <rect x="3" y="24" width="90" height="12" fill="#fff" opacity=".7" />
      <rect x="14" y="6" width="20" height="9" rx="3" fill="#cbb6ee" />
      <circle cx="56" cy="37" r="18" fill="#fff" />
      <circle cx="56" cy="37" r="13" fill="#6a3346" />
      <circle cx="56" cy="37" r="7" fill="#a98bd6" />
      <circle cx="52" cy="33" r="2.6" fill="#fff" />
      <rect x="72" y="17" width="14" height="7" rx="2" fill="#fff6c9" />
      <circle cx="18" cy="24" r="3" fill="#d2475f" />
      <path d="M12 48c-2.4-3.6-7-1-5.4 2.4 1.2 2.6 5.4 4.6 5.4 4.6s4.2-2 5.4-4.6C19 47 14.400 44.400 12 48z" fill="#f59ab8" />
    </svg>
  );
}

export function Stamp() {
  const { c } = useExperience();
  return (
    <span className="stamp" aria-hidden="true">
      <i>
        <b>♡</b>
        {c.birthdayDate}
      </i>
    </span>
  );
}

export function Deco({ style, children }: { style: CSSProperties; children: React.ReactNode }) {
  return (
    <span className="deco" style={style} aria-hidden="true">
      {children}
    </span>
  );
}

export function Spark({ kind, style, glyph }: { kind?: "r" | "p"; style: CSSProperties; glyph: string }) {
  return (
    <span className={kind ? `spark ${kind}` : "spark"} style={style} aria-hidden="true">
      {glyph}
    </span>
  );
}

export function CupcakeSvg() {
  return (
    <svg viewBox="0 0 200 250" className="sticker" aria-hidden="true">
      <g className="smoke" fill="none" stroke="#c9b4ee" strokeWidth="3" strokeLinecap="round">
        <path d="M100 40c-6-6 6-10 0-18" />
        <path d="M108 36c-4-5 5-8 1-14" />
      </g>
      <path className="flame" d="M100 22c-9 10-11 18-6 23 4 4 9 4 12 0 5-5 3-13-6-23z" fill="#ffb347" />
      <rect x="94" y="46" width="12" height="52" rx="3" fill="#fff" />
      <path d="M94 56l12-6M94 68l12-6M94 80l12-6M94 92l12-6" stroke="#f59ab8" strokeWidth="4" />
      <ellipse cx="100" cy="150" rx="74" ry="30" fill="#f59ab8" />
      <ellipse cx="100" cy="128" rx="58" ry="27" fill="#f9b3c9" />
      <ellipse cx="100" cy="106" rx="38" ry="21" fill="#fbcfdd" />
      <path d="M40 142c22 12 96 12 120 0M56 120c18 9 70 9 88 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <g fill="#d2475f">
        <path d="M134 116c-3-5-10-1-8 4 2 4 8 7 8 7s6-3 8-7c2-5-5-9-8-4z" />
        <circle cx="62" cy="134" r="3.4" />
        <circle cx="150" cy="146" r="3.4" />
      </g>
      <g fill="#fff">
        <circle cx="78" cy="112" r="3" />
        <circle cx="118" cy="140" r="3" />
        <circle cx="50" cy="152" r="3" />
        <circle cx="94" cy="158" r="3" />
      </g>
      <path d="M30 158h140l-17 82H47z" fill="#fff8ec" />
      <path d="M30 158h140l-3 14H33z" fill="#d2475f" opacity=".16" />
      <path d="M50 160l8 80M70 160l5 80M90 160l3 80M110 160l-3 80M130 160l-5 80M150 160l-8 80" stroke="#d2475f" strokeWidth="3" opacity=".55" />
    </svg>
  );
}

export function BackButton() {
  const { c } = useExperience();
  return (
    <button className="back" data-go="menu">
      {c.copy.back}
    </button>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");
