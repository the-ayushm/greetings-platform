"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useExperience } from "../context";
import { BackButton, Bow, Deco, pad } from "../parts";

const tkCols = ["#ffd5e1", "#eadcfc", "#fff0d9", "#fbc3d4", "#f3e9ff", "#ffe3d3"];
const tilt = [-1.5, 1.2, -0.8, 1.6, -1.2];

export function Coupons() {
  const { c, fill, usedCoupons, setLift } = useExperience();
  // The original rebuilt the list after every use, replaying the slide-in; keyed remount keeps that.
  const [version, setVersion] = useState(0);
  const prev = useRef(usedCoupons);
  useEffect(() => {
    if (prev.current !== usedCoupons) {
      prev.current = usedCoupons;
      setVersion((v) => v + 1);
    }
  }, [usedCoupons]);

  return (
    <div className="page">
      <BackButton />
      <Deco style={{ right: 4, top: 8, width: 60, transform: "rotate(16deg)" }}>
        <Bow c="var(--pink)" />
      </Deco>
      <h2 className="pix-banner" style={{ transform: "rotate(1deg)" }}>
        {fill(c.couponsTitle)}
      </h2>
      <p className="hand center" style={{ margin: "6px 0 0" }}>
        {fill(c.couponsNote)}
      </p>
      <div className="tk-list" id="tkList">
        {c.coupons.map((cp, i) => (
          <button
            key={`${version}-${i}`}
            className={`tk-wrap ${usedCoupons.has(i) ? "used" : ""}`}
            data-c={i}
            style={{ "--r": `${tilt[i % 5]}deg`, "--i": i } as CSSProperties}
            onClick={() => setLift({ type: "coupon", i })}
          >
            <span className="tk" style={{ "--c": tkCols[i % tkCols.length] } as CSSProperties}>
              <span className="tk-stub" aria-hidden="true">
                <b>♥</b>ADMIT
                <br />
                ONE
              </span>
              <span className="tk-body">
                <span className="tk-small">{fill(c.copy.couponGoodFor)}</span>
                <span className="tk-title" dir="auto">{fill(cp.title)}</span>
                <span className="tk-no">{fill(c.copy.couponNo, { n: pad(i + 1) })}</span>
                <span className="tk-used">{fill(c.copy.usedStamp)}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CouponLift({ i }: { i: number }) {
  const { c, fill, usedCoupons, toggleCoupon, timers, popAt } = useExperience();
  const cp = c.coupons[i];
  const [turned, setTurned] = useState(false);
  const stampRef = useRef<HTMLSpanElement>(null);
  const used = usedCoupons.has(i);
  const wasUsed = useRef(used);

  useEffect(() => {
    let live = true;
    timers.later(() => live && setTurned(true), 750);
    return () => {
      live = false;
    };
  }, [timers]);

  useEffect(() => {
    if (used && !wasUsed.current) popAt(stampRef.current, 10);
    wasUsed.current = used;
  }, [used, popAt]);

  if (!cp) return null;
  return (
    <div className="lift-in" style={{ width: "min(100%,340px)" }}>
      <div className="flip">
        <button className={`flip-card${turned ? " turned" : ""}`} id="flipCard" aria-label="Flip the coupon" onClick={() => setTurned((t) => !t)}>
          <span className="face f" style={{ "--c": tkCols[i % tkCols.length] } as CSSProperties}>
            <span className="big-heart" aria-hidden="true">♥</span>
            <span className="tk-small">{fill(c.copy.couponGoodFor)}</span>
            <span className="tk-title" dir="auto">{fill(cp.title)}</span>
            <span className="foot">ADMIT ONE · NO. {pad(i + 1)}</span>
          </span>
          <span className="face b">
            <span className={`rstamp ${used ? "on" : ""}`} id="rStamp" ref={stampRef}>
              {fill(c.copy.usedStamp)}
            </span>
            <span className="tk-small">{fill(c.copy.finePrint)}</span>
            <span className="msg" dir="auto">{fill(cp.message)}</span>
            <span className="foot">{fill(c.copy.couponFrom)}</span>
          </span>
        </button>
      </div>
      <div className="lift-nav">
        <button data-close>{fill(c.copy.backToCoupons)}</button>
        <button
          id="useBtn"
          onClick={() => {
            toggleCoupon(i);
            setTurned(true);
          }}
        >
          {used ? fill(c.copy.unuseIt) : fill(c.copy.useIt)}
        </button>
      </div>
    </div>
  );
}
