"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChibiCouple, CouponIcon, Heart } from "../art";
import { useLove } from "../context";
import { Btn, NavRow, Paper, Photo, Polaroid, StepTitle } from "../parts";
import { Lines, RichText } from "../text";
import { NightScene } from "./Night";

/** 12. Love letter with tabs (Open Letter, Reasons, Promises…). Tabs follow the ARIA tabs pattern. */
export function Letter() {
  const { c, fill } = useLove();
  const L = c.letter;
  const [tab, setTab] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const cur = L.tabs[Math.min(tab, L.tabs.length - 1)]!;
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (tab + d + L.tabs.length) % L.tabs.length;
    setTab(n);
    tabs.current[n]?.focus();
  };
  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-letter-paper" flowers={false}>
        <div className="lu-letter-layout">
          <div className="lu-letter-tabs" role="tablist" aria-label="Letter sections" aria-orientation="vertical" onKeyDown={onKey}>
            {L.tabs.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => void (tabs.current[i] = el)}
                type="button"
                role="tab"
                id={`lu-tab-${t.id}`}
                aria-selected={i === tab}
                aria-controls="lu-letter-panel"
                tabIndex={i === tab ? 0 : -1}
                className={`lu-letter-tab ${i === tab ? "on" : ""}`}
                onClick={() => setTab(i)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-4-6-5-6-2.5S10 9 12 9Zm0 0c2-4 6-5 6-2.5S14 9 12 9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                {fill(t.label)}
              </button>
            ))}
          </div>
          <div className="lu-letter-sheet" role="tabpanel" id="lu-letter-panel" aria-labelledby={`lu-tab-${cur.id}`} key={cur.id}>
            <StepTitle className="lu-letter-heading" as="h1">
              {fill(L.heading)}
            </StepTitle>
            <RichText text={fill(cur.body)} className="lu-letter-body" />
            {(L.signoff || L.signature) && (
              <p className="lu-letter-sign">
                {L.signoff && <span>{fill(L.signoff)}</span>}
                {L.signature && <span className="lu-signature">{fill(L.signature)}</span>}
                <Heart className="lu-inline-heart" filled={false} />
              </p>
            )}
            <span className="lu-pen" aria-hidden="true" />
          </div>
        </div>
        <ChibiCouple className="lu-chibi lu-chibi-letter" />
        <NavRow />
      </Paper>
    </div>
  );
}

function readRedeemed(key: string | null): Set<string> {
  if (!key) return new Set();
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

/** 13. Love coupons. Redeeming is remembered on this device; it is also sent to the creator if they enabled responses. */
export function Coupons() {
  const { c, fill, mode, storageKey, respond, burst, next } = useLove();
  const k = c.coupons;
  const key = mode === "live" ? `lu:${storageKey}:coupons` : null;
  const [redeemed, setRedeemed] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    // Restored after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRedeemed(readRedeemed(key));
  }, [key]);

  const redeem = async (id: string, el: Element | null) => {
    const nextSet = new Set(redeemed).add(id);
    setRedeemed(nextSet);
    burst(el, 18);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify([...nextSet]));
      } catch {
        /* private mode: state lasts for this visit */
      }
    }
    const r = await respond("coupon", id, "redeemed");
    setNote(r === "stored" ? `${fill("{me}")} has been told ♡` : r === "preview" ? "Preview: redemptions aren't sent." : "");
  };

  return (
    <div className="lu-scene lu-paper-scene">
      <Paper className="lu-coupons-paper">
        <StepTitle>{fill(k.title)}</StepTitle>
        {k.subtitle && <p className="lu-subtitle">{fill(k.subtitle)}</p>}
        <ul className="lu-coupons">
          {k.items.map((it) => {
            const done = redeemed.has(it.id);
            const isOpen = openId === it.id;
            return (
              <li key={it.id} className={`lu-coupon c-${it.color} ${done ? "done" : ""} ${isOpen ? "open" : ""}`}>
                <button type="button" className="lu-coupon-face" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : it.id)}>
                  <span className="lu-coupon-icon">
                    <CouponIcon icon={it.icon} />
                  </span>
                  <span className="lu-coupon-text">
                    <span className="lu-coupon-title">{fill(it.title)}</span>
                    {it.description && <span className="lu-coupon-desc">{fill(it.description)}</span>}
                  </span>
                  {done && <span className="lu-stamp">{fill(k.redeemedLabel)}</span>}
                </button>
                {isOpen && (
                  <div className="lu-coupon-back">
                    {it.redeem && (
                      <p>
                        <Lines text={fill(it.redeem)} />
                      </p>
                    )}
                    {done ? (
                      <p className="lu-coupon-done">
                        <Heart className="lu-inline-heart" /> {fill(k.redeemedLabel)}
                      </p>
                    ) : (
                      <button type="button" className="lu-btn lu-btn-primary lu-btn-sm" onClick={(e) => void redeem(it.id, e.currentTarget)}>
                        {fill(k.redeemButton)}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="lu-quiz-note" role="status" aria-live="polite">
          {note}
        </p>
        <NavRow nextLabel={fill(k.footer)} onNext={next} />
      </Paper>
    </div>
  );
}

/** 14. Polaroids hanging from a string of lights. */
export function PhotoWall() {
  const { c, fill } = useLove();
  const w = c.photowall;
  return (
    <NightScene couple={false} className="lu-wall-scene">
      <StepTitle className="lu-hero lu-glow-text">{fill(w.title)}</StepTitle>
      {w.subtitle && <p className="lu-hero-sub">{fill(w.subtitle)}</p>}
      <div className="lu-wall">
        <span className="lu-wall-string" aria-hidden="true" />
        <ul>
          {w.photos.map((p, i) => (
            <li key={p.id} style={{ animationDelay: `${(i * 0.4) % 2}s` }}>
              <span className="lu-clip" aria-hidden="true" />
              <Polaroid media={p.image} caption={fill(p.caption)} seed={i + 1} tilt={((i * 5) % 7) - 3} tape={false} sizes="(max-width: 640px) 46vw, 200px" />
            </li>
          ))}
        </ul>
      </div>
      <WallNav />
    </NightScene>
  );
}

function WallNav() {
  const { c, fill, next, back } = useLove();
  return (
    <div className="lu-nav lu-nav-night">
      <Btn variant="ghost" onClick={back}>
        {fill(c.copy.back)}
      </Btn>
      <Btn onClick={next}>
        {fill(c.copy.next)} <span aria-hidden="true">→</span>
      </Btn>
    </div>
  );
}

/** 15. You Are My Everything. */
export function Final() {
  const { c, fill, burst, restart, still } = useLove();
  const f = c.final;
  const [done, setDone] = useState(false);
  const heart = useRef<HTMLDivElement>(null);
  return (
    <NightScene className={`lu-final heart-${f.heart}`}>
      <StepTitle className="lu-hero lu-glow-text">{fill(f.title)}</StepTitle>
      {f.message && (
        <p className="lu-hero-sub">
          <Lines text={fill(f.message)} />
        </p>
      )}
      <div className="lu-final-row">
        <div ref={heart} className={`lu-big-heart ${done ? "burst" : ""}`} aria-hidden="true">
          {f.photo ? (
            <span className="lu-big-heart-photo">
              <Photo media={f.photo} alt="" seed={5} sizes="280px" />
            </span>
          ) : null}
          <Heart />
        </div>
        {f.notes.length > 0 && (
          <ul className="lu-tags">
            {f.notes.map((n, i) => (
              <li key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                {fill(n)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {f.signature && <p className="lu-final-sign lu-hand">{fill(f.signature)}</p>}
      {!done ? (
        <Btn
          variant="glow"
          className="lu-forever"
          onClick={() => {
            setDone(true);
            burst(heart.current, still ? 0 : 30);
          }}
        >
          {fill(f.button)}
        </Btn>
      ) : (
        <div className="lu-after" role="status">
          {f.afterMessage && (
            <p className="lu-hero-sub lu-after-msg">
              <Lines text={fill(f.afterMessage)} />
            </p>
          )}
          <Btn variant="ghost" onClick={restart}>
            {fill(c.copy.restart)}
          </Btn>
        </div>
      )}
    </NightScene>
  );
}
