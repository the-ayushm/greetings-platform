"use client";

import type { ReactNode } from "react";
import { CoupleBack, FairyLights, Flowers, Skyline } from "../art";
import { useLove } from "../context";

/** Warm night-sky stage used by the welcome, unlock, photo wall and final scenes. */
export function NightScene({ children, couple = true, className }: { children: ReactNode; couple?: boolean; className?: string }) {
  const { c } = useLove();
  return (
    <section className={`lu-night ${className ?? ""}`}>
      <div className="lu-sky" aria-hidden="true">
        <span className="lu-stars" />
        <span className="lu-moon" />
        <Skyline className="lu-skyline" />
        <span className="lu-bokeh" />
      </div>
      {c.theme.lights && <FairyLights className="lu-lights-top" count={16} />}
      <Flowers className="lu-night-flowers lu-nf-l" flip />
      <Flowers className="lu-night-flowers lu-nf-r" />
      <div className="lu-night-body">{children}</div>
      {couple && <CoupleBack className="lu-couple-back" />}
    </section>
  );
}
