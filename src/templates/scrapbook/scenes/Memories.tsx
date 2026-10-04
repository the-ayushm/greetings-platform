"use client";

import type { CSSProperties } from "react";
import { useExperience } from "../context";
import { BackButton, Deco, Digicam, Photo } from "../parts";

// width, justify, margin-top, rotation, decoration
const lay = [
  ["96%", "start", "0px", "-5deg", "tape"], ["88%", "end", "34px", "4deg", "clip"],
  ["84%", "end", "-14px", "3deg", "pin"], ["98%", "start", "8px", "-3deg", "tape"],
  ["92%", "start", "-10px", "5deg", "clip"], ["86%", "end", "18px", "-6deg", "pin"],
  ["90%", "end", "-6px", "-2deg", "tape"], ["94%", "start", "22px", "4deg", "pin"],
  ["90%", "start", "0px", "-4deg", "clip"], ["92%", "end", "14px", "3deg", "tape"],
] as const;

export function Memories() {
  const { c, fill, setLift } = useExperience();
  return (
    <div className="page">
      <BackButton />
      <Deco style={{ right: 8, top: 14, width: 82, transform: "rotate(12deg)" }}>
        <Digicam />
      </Deco>
      <h2 className="pix-banner" style={{ transform: "rotate(-1.5deg)" }}>
        {fill(c.memoriesTitle)}
      </h2>
      <div className="mem-grid">
        {c.memories.map((m, i) => {
          const l = lay[i % lay.length]!;
          const deco = l[4] === "tape" ? "tape" + (i % 4 ? "" : " pk") : l[4];
          return (
            <button
              key={i}
              className="mem"
              data-m={i}
              style={{ "--w": l[0], "--j": l[1], "--mt": l[2], "--r": l[3], "--i": i, "--z": (i % 3) + 1, "--tr": `${i % 2 ? 5 : -5}deg` } as CSSProperties}
              aria-label={`Open photo: ${fill(m.caption)}`}
              onClick={() => setLift({ type: "photo", i })}
            >
              <span className={deco} aria-hidden="true"></span>
              <span className="pol">
                <Photo media={m.image} i={i + 1} alt={m.caption} sizes="(min-width: 768px) 220px, 45vw" />
                <span className="cap">{fill(m.caption)}</span>
              </span>
              {i % 3 === 1 ? (
                <span className="hsticker" aria-hidden="true">
                  ♥
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mem-note">{fill(c.copy.memoriesNote)}</p>
    </div>
  );
}

export function PhotoLift({ i: raw }: { i: number }) {
  const { c, fill, setLift } = useExperience();
  const n = c.memories.length;
  const i = ((raw % n) + n) % n;
  const m = c.memories[i];
  if (!m) return null;
  return (
    <div className="lift-in">
      <div className="pol big">
        <Photo media={m.image} i={i + 1} alt={m.caption} sizes="(min-width: 768px) 400px, 92vw" />
        <span className="cap">{fill(m.caption)}</span>
      </div>
      <div className="lift-nav">
        <button data-p={i - 1} aria-label="Previous photo" onClick={() => setLift({ type: "photo", i: i - 1 })}>
          ‹
        </button>
        <button data-close>{fill(c.copy.putBack)}</button>
        <button data-p={i + 1} aria-label="Next photo" onClick={() => setLift({ type: "photo", i: i + 1 })}>
          ›
        </button>
      </div>
    </div>
  );
}
