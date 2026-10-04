"use client";

import { useState } from "react";
import { useExperience } from "../context";
import { BackButton, Bow, CupcakeSvg, Deco, Photo } from "../parts";

export function Surprise() {
  const { c, fill, popAt, confetti, timers, appEl } = useExperience();
  const S = c.surprise;
  const [blown, setBlown] = useState(false);
  const [next, setNext] = useState(false);

  return (
    <div className="page">
      <BackButton />
      <div className="scrap">
        <span className="paperbg"></span>
        <span className="tape pk" style={{ left: -16, top: 12, transform: "rotate(-34deg)" }}></span>
        <span className="tape" style={{ right: -18, bottom: 20, transform: "rotate(-30deg)" }}></span>
        <Deco style={{ right: -12, top: -24, width: 70, transform: "rotate(14deg)" }}>
          <Bow />
        </Deco>
        <h2 className="s-top">{fill(S.titleTop)}</h2>
        <p className="s-name" dir="auto">{fill(c.recipientName)}</p>
        <p className="s-small">{fill(S.small)}</p>
        <div className="cake-row">
          <span className="pol a">
            <Photo media={S.photos[0]} i={2} sizes="118px" />
            <span className="cap">{fill(S.captions[0])}</span>
          </span>
          <span className="pol b">
            <Photo media={S.photos[1]} i={5} sizes="118px" />
            <span className="cap">{fill(S.captions[1])}</span>
          </span>
          <button
            className={`cupcake${blown ? " blown" : ""}`}
            id="cupcake"
            aria-label="Tap the cupcake to blow out the candle"
            onClick={(e) => {
              const el = e.currentTarget,
                b = el.getBoundingClientRect(),
                app = appEl();
              popAt(el, 14);
              if (app) {
                const r = app.getBoundingClientRect();
                confetti(blown ? 30 : 80, (b.left + b.width / 2 - r.left) / r.width, (b.top + b.height * 0.3 - r.top) / r.height);
              }
              if (blown) return;
              setBlown(true);
              timers.later(() => setNext(true), 1300);
            }}
          >
            <CupcakeSvg />
          </button>
        </div>
        <p className={`s-hint${blown ? "" : " pulse"}`} id="sHint" aria-live="polite">
          {blown ? fill(S.afterTap) : fill(S.hint)}
        </p>
        <div className={`s-next${next ? " show" : ""}`} id="sNext">
          <span className="cta">
            <button data-go="final" tabIndex={next ? undefined : -1}>
              {fill(S.next)}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
