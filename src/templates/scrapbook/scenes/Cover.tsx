"use client";

import { addressSlug, useExperience } from "../context";
import { Bow, Deco, Digicam, Photo, Spark, Stamp } from "../parts";

export function Cover() {
  const { c, fill } = useExperience();
  return (
    <div className="page">
      <Spark glyph="✦" style={{ left: "7%", top: "5%" }} />
      <Spark kind="r" glyph="♥" style={{ right: "9%", top: "11%", animationDelay: "1.2s" }} />
      <Spark glyph="✦" style={{ left: "11%", bottom: "6%", animationDelay: ".6s" }} />
      <Spark kind="p" glyph="♥" style={{ right: "6%", bottom: "12%", animationDelay: "2s" }} />
      <div className="cover-paper">
        <Deco style={{ right: -20, top: -26, transform: "rotate(9deg)" }}>
          <Stamp />
        </Deco>
        <Deco style={{ left: -24, top: -22, width: 66, transform: "rotate(-18deg)" }}>
          <Bow />
        </Deco>
        <div className="c-left">
          <span className="addr" aria-hidden="true">
            <i></i>
            {`www.for-${addressSlug(c.recipientName)}.love`}
          </span>
          <h1 className="cover-top">{fill(c.cover.titleTop)}</h1>
          <p className="cover-name" dir="auto">
            {fill(c.recipientName)} <span aria-hidden="true">♡</span>
          </p>
        </div>
        <div className="cover-photo">
          <span className="tape" style={{ left: "50%", top: -12, marginLeft: -37, transform: "rotate(-7deg)" }}></span>
          <div className="pol">
            <Photo media={c.cover.photo} i={0} alt={c.recipientName} />
            <span className="cap">{fill(c.cover.photoCaption)}</span>
          </div>
          <Deco style={{ right: -38, top: -6, width: 72, transform: "rotate(12deg)" }}>
            <Digicam />
          </Deco>
        </div>
        <div className="c-left">
          <p className="cover-hand">{fill(c.cover.handwritten)}</p>
          <span className="cta">
            <button data-go="quiz">{fill(c.cover.button)}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
