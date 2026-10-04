"use client";

import { useState } from "react";
import { useExperience } from "../context";
import { Bow, Deco, Spark } from "../parts";

export function Quiz() {
  const { c, fill, popAt, timers, confetti } = useExperience();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const n = c.questions.length;
  const done = step >= n;
  const q = c.questions[step];

  const answer = (i: number, el: HTMLElement) => {
    if (picked !== null || !q) return;
    setPicked(i);
    popAt(el, 12);
    timers.later(() => {
      setStep((s) => s + 1);
      setPicked(null);
      if (step + 1 >= n) confetti(36, 0.5, 0.5);
    }, 1150);
  };

  return (
    <div className="page">
      <div className="lace" aria-hidden="true"></div>
      <div className="quiz-mid">
        <Deco style={{ right: -6, top: "6%", width: 62, transform: "rotate(14deg)" }}>
          <Bow c="var(--pink)" />
        </Deco>
        <Spark kind="r" glyph="♥" style={{ left: "4%", top: "12%" }} />
        <Spark glyph="✦" style={{ right: "10%", bottom: "10%", animationDelay: "1s" }} />
        <div className="win">
          <div className="win-bar">
            <span id="qBar">{done ? fill(c.copy.readyBar) : fill(c.copy.questionOf, { n: step + 1, total: n })}</span>
            <span aria-hidden="true">
              <b>_</b>
              <b>□</b>
              <b>×</b>
            </span>
          </div>
          <div className="win-body" id="qBody">
            {done ? (
              <div className="q-swap" key="ready">
                <p className="start-1">{fill(c.startLine[0])}</p>
                <p className="start-2">{fill(c.startLine[1])}</p>
                <button className="px-btn big" data-go="menu">
                  {fill(c.startButton)}
                </button>
              </div>
            ) : q ? (
              <div className="q-swap" key={step}>
                <p className="q-text" dir="auto">{fill(q.q)}</p>
                <div className="q-opts">
                  {q.options.map((o, i) => (
                    <button key={i} className={`px-btn${picked === i ? " picked" : ""}`} data-a={i} aria-pressed={picked === i} onClick={(e) => answer(i, e.currentTarget)}>
                      {fill(o)}
                    </button>
                  ))}
                </div>
                <div className={`q-reply${picked !== null ? " show" : ""}`} id="qReply" aria-live="polite">
                  {picked !== null ? fill(q.replies[picked] || "♡") : ""}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="q-dots" id="qDots" role="img" aria-label={`${Math.min(step, n)} of ${n} answered`}>
          {c.questions.map((_, i) => (
            <span key={i} className={i < step ? "on" : ""}>
              ♥
            </span>
          ))}
        </div>
      </div>
      <div className="lace flip" aria-hidden="true"></div>
    </div>
  );
}
