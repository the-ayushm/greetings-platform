"use client";

import { WaxSeal } from "./art";

export type EnvelopeState = "closed" | "opening" | "skip";

/** One side flap: the dark embossed damask plus its gilded twin (roses, then leaves) that the light reveals. */
function Side({ side }: { side: "left" | "right" }) {
  return (
    <div className={`wd-env-flap wd-env-${side}`}>
      <svg className="wd-env-emboss" aria-hidden="true" focusable="false">
        <rect width="100%" height="100%" fill="url(#wd-p-emboss)" />
      </svg>
      <div className="wd-env-gild wd-env-gild-rose" aria-hidden="true">
        <svg className="wd-env-emboss" focusable="false">
          <rect width="100%" height="100%" fill="url(#wd-p-gild-rose)" />
        </svg>
      </div>
      <div className="wd-env-gild wd-env-gild-leaf" aria-hidden="true">
        <svg className="wd-env-emboss" focusable="false">
          <rect width="100%" height="100%" fill="url(#wd-p-gild-leaf)" />
        </svg>
      </div>
    </div>
  );
}

/**
 * The sealed envelope over the invitation. A tap anywhere (or Enter/Space on the seal) wakes the
 * seal, light leaks out of its centre and gilds the embossed roses outwards, the seal cracks,
 * the light peaks as the flaps part, then everything fades onto the cover. The parent removes
 * it once the sequence is done (timers, not animation events, so it always finishes).
 */
export function Envelope({ state, initials, hint, onOpen }: { state: EnvelopeState; initials: string; hint: string; onOpen: () => void }) {
  return (
    <div className="wd-env" data-state={state} onClick={state === "closed" ? onOpen : undefined}>
      <div className="wd-env-back" />
      <Side side="left" />
      <Side side="right" />
      <div className="wd-env-flap wd-env-bottom" />
      <div className="wd-env-flap wd-env-top" />
      <svg className="wd-env-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 0L50 52L100 0M0 100L50 52L100 100" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="wd-env-lines-lit" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <path className="wd-env-lines-glow" d="M0 0L50 52L100 0M0 100L50 52L100 100" vectorEffect="non-scaling-stroke" />
          <path d="M0 0L50 52L100 0M0 100L50 52L100 100" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="wd-env-light" aria-hidden="true">
        <span className="wd-env-halo" />
        <span className="wd-env-rays" />
        <span className="wd-env-rays wd-env-rays-2" />
        <span className="wd-env-core" />
        <span className="wd-env-flare" />
        <span className="wd-env-ghost wd-env-ghost-1" />
        <span className="wd-env-ghost wd-env-ghost-2" />
        <span className="wd-env-ghost wd-env-ghost-3" />
      </div>
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
