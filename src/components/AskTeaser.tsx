"use client";

import { useState } from "react";
import { AskMini } from "./AskMini";

/**
 * Product-page phone: a drawing of the question until tapped, then the live demo. Keeps the
 * store's first load light (the interactive page loads only for visitors who try it).
 */
export function AskTeaser() {
  const [live, setLive] = useState(false);
  return live ? (
    <iframe src="/demo/do-you-love-me" title="Interactive demo of Do You Love Me?" className="block aspect-[390/844] w-full bg-[#ffc4cf]" />
  ) : (
    <button type="button" onClick={() => setLive(true)} className="group relative block aspect-[390/844] w-full overflow-hidden text-[15px]" aria-label="Try the interactive Do You Love Me? demo here" data-testid="ask-teaser">
      <span className="absolute inset-0 block">
        <AskMini screen={{ kind: "ask", step: 2 }} className="size-full" />
      </span>
      <span className="absolute inset-x-8 bottom-[7%] rounded-full bg-[linear-gradient(180deg,#ff7d95,#e0445f)] px-4 py-3 text-center font-bold text-white shadow-[0_10px_24px_-8px_rgba(224,68,95,.7)] transition group-hover:scale-105">
        Tap to try it ♡
      </span>
    </button>
  );
}
