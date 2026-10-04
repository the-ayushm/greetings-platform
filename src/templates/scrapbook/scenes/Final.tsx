"use client";

import { useEffect, useState } from "react";
import { useExperience } from "../context";
import { Bow, Deco, Photo, Spark } from "../parts";

export function Final({ active, onRestart }: { active: boolean; onRestart: () => void }) {
  const { c, fill, timers, confetti, riseHearts, appEl, go } = useExperience();
  const F = c.final;
  const [pre, setPre] = useState<number | null>(null);
  const [fin, setFin] = useState(false);
  const [lines, setLines] = useState(0);
  const [again, setAgain] = useState(false);

  // enter.final: the "WAIT..." beats, then the paper, then the lines one by one.
  useEffect(() => {
    if (!active) return;
    let live = true;
    const later = (fn: () => void, ms: number) => timers.later(() => live && fn(), ms);
    let t = 700;
    F.wait.forEach((_, i) => {
      later(() => setPre(i), t);
      later(() => setPre((p) => (p === i ? null : p)), t + 1500);
      t += 2100;
    });
    later(() => {
      setFin(true);
      confetti(110, 0.5, 0.35);
      riseHearts(16);
    }, t);
    F.lines.forEach((_, i) => later(() => setLines((n) => Math.max(n, i + 1)), t + 2200 + i * 950));
    later(() => {
      setAgain(true);
      confetti(40, 0.5, 0.6);
    }, t + 2600 + F.lines.length * 950);
    return () => {
      live = false;
    };
    // runs once per entry; the scene remounts on every visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="page">
      <div className="pre" aria-hidden={fin ? true : undefined}>
        {F.wait.map((w, i) => (
          <p key={i} className={pre === i ? "show" : ""}>
            {fill(w)}
          </p>
        ))}
      </div>
      <div className={`fin${fin ? " show" : ""}`} id="fin">
        <Spark glyph="✦" style={{ left: "2%", top: "4%" }} />
        <Spark glyph="✦" style={{ right: "4%", top: "10%", animationDelay: "1.4s" }} />
        <Spark glyph="✦" style={{ left: "8%", bottom: "6%", animationDelay: ".7s" }} />
        <Spark glyph="✦" style={{ right: "10%", bottom: "3%", animationDelay: "2.1s" }} />
        <div className="fin-paper">
          <span className="paperbg"></span>
          <Deco style={{ left: -18, top: -22, width: 68, transform: "rotate(-16deg)" }}>
            <Bow />
          </Deco>
          <div className="fin-photo">
            <span className="tape pk"></span>
            <div className="pol">
              <Photo media={F.photo} i={3} alt={F.photoCaption} />
              <span className="cap">{fill(F.photoCaption)}</span>
            </div>
          </div>
          <h2 className="fin-h" dir="auto">{fill(F.heading)}</h2>
          <p className="fin-sub" dir="auto">{fill(F.finalMessage)}</p>
          <p className="fin-lines">
            {F.lines.map((l, i) => (
              <span key={i} className={i < lines ? "show" : ""} dir="auto">
                {fill(l)}
              </span>
            ))}
          </p>
          <div className={`fin-again${again ? " show" : ""}`} id="finAgain">
            <button
              className="px-btn"
              id="againBtn"
              tabIndex={again ? undefined : -1}
              onClick={() => {
                onRestart();
                appEl()
                  ?.querySelectorAll(".rise")
                  .forEach((h) => h.remove());
                go("cover");
              }}
            >
              {fill(F.restart)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
