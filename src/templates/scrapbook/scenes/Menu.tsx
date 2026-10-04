"use client";

import { useState, type CSSProperties } from "react";
import { useExperience } from "../context";
import { Bow } from "../parts";

const cardDefs = [
  { id: "letter", glyph: "♥", c: "#f9c4d4", r: "-5deg" },
  { id: "memories", glyph: "✿", c: "#e7d9fb", r: "4deg" },
  { id: "coupons", glyph: "★", c: "#fbdcc8", r: "3deg" },
  { id: "song", glyph: "♪", c: "#f6b3c7", r: "-4deg" },
  { id: "gift", glyph: "", c: "#fff3f6", r: "-2deg", go: "surprise" },
] as const;

export function Menu() {
  const { c, fill, opened, markOpened } = useExperience();
  // Like the original, "opened" stamps and the counter reflect the state at the moment the
  // menu is entered (this component remounts on every entry), not mid-transition.
  const [snapshot] = useState(() => new Set(opened));
  return (
    <div className="page">
      <span className="tape pk" style={{ left: -14, top: 22, transform: "rotate(-32deg)" }}></span>
      <span className="tape" style={{ right: -22, top: 4, transform: "rotate(34deg)" }}></span>
      <h2 className="pix-banner">{fill(c.menuTitle)}</h2>
      <p className="hand center" style={{ margin: "8px 0 0", transform: "rotate(-1deg)" }}>
        {fill(c.menuNote)}
      </p>
      <div className="menu-grid">
        {cardDefs.map((d, i) => (
          <button
            key={d.id}
            className={`env-wrap ${d.id === "gift" ? "gift" : ""}${snapshot.has(d.id) ? " done" : ""}`}
            style={{ "--r": d.r, "--i": i, "--c": d.c } as CSSProperties}
            data-go={"go" in d ? d.go : d.id}
            data-card={d.id}
            onClick={() => markOpened(d.id)}
          >
            <span className="env" aria-hidden="true">
              {d.id === "gift" ? (
                <span className="bow">
                  <Bow />
                </span>
              ) : (
                <span className="seal">{d.glyph}</span>
              )}
            </span>
            <span className="env-label">{fill(c.cards[d.id])}</span>
            <span className="env-done">{fill(c.copy.opened)}</span>
          </button>
        ))}
      </div>
      <p className="menu-count" id="menuCount" aria-live="polite">
        {cardDefs.map((d) => (
          <b key={d.id} className={snapshot.has(d.id) ? "on" : ""} aria-hidden="true">
            ♥
          </b>
        ))}
        <span className="hand" style={{ display: "block", fontSize: 20 }}>
          {fill(c.copy.openedCount, { n: snapshot.size, total: cardDefs.length })}
        </span>
      </p>
    </div>
  );
}
