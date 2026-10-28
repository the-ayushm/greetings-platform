"use client";

import { WaxSeal } from "./art";

export type EnvelopeState = "closed" | "opening" | "skip";

/**
 * The sealed envelope over the invitation. A tap anywhere (or Enter/Space on the seal)
 * breaks the seal, opens the flaps and lets the golden light through; the parent removes it
 * once the animation is done (timers, not animation events, so it always finishes).
 */
export function Envelope({ state, initials, hint, onOpen }: { state: EnvelopeState; initials: string; hint: string; onOpen: () => void }) {
  return (
    <div className="wd-env" data-state={state} onClick={state === "closed" ? onOpen : undefined}>
      <div className="wd-env-back" />
      <div className="wd-env-light" aria-hidden="true">
        <span className="wd-env-beam" />
      </div>
      <div className="wd-env-flap wd-env-left">
        <svg className="wd-env-emboss" aria-hidden="true" focusable="false">
          <rect width="100%" height="100%" fill="url(#wd-p-emboss)" />
        </svg>
      </div>
      <div className="wd-env-flap wd-env-right">
        <svg className="wd-env-emboss" aria-hidden="true" focusable="false">
          <rect width="100%" height="100%" fill="url(#wd-p-emboss)" />
        </svg>
      </div>
      <div className="wd-env-flap wd-env-bottom" />
      <div className="wd-env-flap wd-env-top" />
      <svg className="wd-env-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 0L50 52L100 0M0 100L50 52L100 100" vectorEffect="non-scaling-stroke" />
      </svg>
      <button
        type="button"
        className="wd-seal"
        onClick={(e) => {
          e.stopPropagation();
          if (state === "closed") onOpen();
        }}
        aria-label="Open the invitation"
        data-testid="wd-seal"
      >
        <span className="wd-seal-whole">
          <WaxSeal initials={initials} />
        </span>
        <span className="wd-seal-half wd-seal-l">
          <WaxSeal initials={initials} />
        </span>
        <span className="wd-seal-half wd-seal-r">
          <WaxSeal initials={initials} />
        </span>
      </button>
      {hint && <p className="wd-env-hint">{hint}</p>}
    </div>
  );
}
