"use client";

import { useRef, useState } from "react";
import { useExperience } from "../context";
import { BackButton, Stamp } from "../parts";

type Stage = { open: boolean; out: boolean; gone: boolean; hidden: boolean; sheet: boolean; lines: number; doodle: boolean };
const CLOSED: Stage = { open: false, out: false, gone: false, hidden: false, sheet: false, lines: 0, doodle: false };

export function Letter() {
  const { c, fill, popAt, timers, sceneEl } = useExperience();
  const L = c.letter;
  const [st, setSt] = useState<Stage>(CLOSED);
  const lenvRef = useRef<HTMLButtonElement>(null);
  const signRef = useRef<HTMLElement>(null);
  const lineCount = 1 + L.body.length + 2; // greeting, paragraphs, closing, sign-off

  const openEnvelope = () => {
    if (st.open) return;
    setSt((s) => ({ ...s, open: true }));
    popAt(lenvRef.current, 8);
    timers.later(() => setSt((s) => ({ ...s, out: true })), 650);
    timers.later(() => setSt((s) => ({ ...s, gone: true })), 1750);
    timers.later(() => {
      setSt((s) => ({ ...s, hidden: true, sheet: true }));
      const sc = sceneEl("letter");
      if (sc) sc.scrollTop = 0;
      for (let i = 0; i < lineCount; i++) timers.later(() => setSt((s) => ({ ...s, lines: Math.max(s.lines, i + 1) })), 1100 + i * 800);
      timers.later(() => {
        setSt((s) => ({ ...s, doodle: true }));
        popAt(signRef.current, 10);
      }, 1100 + lineCount * 800);
    }, 2350);
  };

  const ln = (i: number, cls: string) => `ln ${cls}${st.lines > i ? " show" : ""}`;
  const wrapCls = `lenv-wrap${st.open ? " open" : ""}${st.out ? " out" : ""}${st.gone ? " gone" : ""}`;

  return (
    <div className="page">
      <BackButton />
      <div className="letter-stage">
        <div className={wrapCls} id="lenvWrap" style={st.hidden ? { display: "none" } : undefined}>
          <button className="lenv" id="lenv" ref={lenvRef} aria-label="Open the envelope" onClick={openEnvelope}>
            <span className="e-back"></span>
            <span className="e-slip"></span>
            <span className="e-front"></span>
            <span className="e-label">{fill(L.envelopeLabel)}</span>
            <span className="e-flap"></span>
            <span className="e-seal">
              <span className="seal" aria-hidden="true">♥</span>
            </span>
          </button>
          <span className="tap-hint">{fill(c.copy.tapEnvelope)}</span>
        </div>
        <article className={`sheet${st.sheet ? " show" : ""}`} id="sheet" aria-hidden={st.sheet ? undefined : true}>
          <span className="tape pk"></span>
          <Stamp />
          <span className={ln(0, "l-greet")} dir="auto">{fill(L.greeting)}</span>
          {L.body.map((p, i) => (
            <span key={i} className={ln(1 + i, "l-p")} dir="auto">
              {fill(p)}
            </span>
          ))}
          <span className={ln(1 + L.body.length, "l-p")} dir="auto">{fill(L.closing)}</span>
          <span className={ln(2 + L.body.length, "l-sign")}>
            {fill(L.signoff)}
            <b ref={signRef}>{fill(c.senderName)}</b>
          </span>
          <span className={`doodle${st.doodle ? " show" : ""}`} aria-hidden="true">
            ♥ ♥ ♥
          </span>
        </article>
      </div>
    </div>
  );
}
