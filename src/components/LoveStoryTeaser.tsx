"use client";

import { useState } from "react";
import { CoupleBack, Heart, Skyline } from "@/templates/lovestory/art";

/**
 * Product-page phone: an illustrated still of the welcome page until tapped, then the live
 * demo. Keeps the store's first load light (the experience loads only for visitors who try it).
 */
export function LoveStoryTeaser({ start }: { start?: string }) {
  const [live, setLive] = useState(false);
  const src = `/demo/love-story${start ? `?at=${encodeURIComponent(start)}` : ""}`;
  return live ? (
    <iframe src={src} title="Interactive demo of a love story website" className="block aspect-[9/17] w-full bg-[#2a0d1f]" />
  ) : (
    <button type="button" onClick={() => setLive(true)} className="group relative block aspect-[9/17] w-full overflow-hidden text-white" aria-label="Try the interactive love story demo here">
      <span className="absolute inset-0 bg-[linear-gradient(180deg,#0d0b2a_0%,#3a1440_55%,#5c0f22_100%)]" />
      <span className="absolute inset-x-0 top-0 h-16 bg-[radial-gradient(6px_8px_at_10%_40%,#ffd27a,transparent),radial-gradient(6px_8px_at_26%_62%,#ffd27a,transparent),radial-gradient(6px_8px_at_42%_48%,#ffd27a,transparent),radial-gradient(6px_8px_at_58%_62%,#ffd27a,transparent),radial-gradient(6px_8px_at_74%_46%,#ffd27a,transparent),radial-gradient(6px_8px_at_90%_60%,#ffd27a,transparent)] opacity-90" />
      <Skyline className="absolute inset-x-0 bottom-[22%] h-[26%] w-full opacity-90" />
      <CoupleBack className="absolute bottom-0 left-1/2 w-[96%] -translate-x-1/2" />
      <span className="absolute inset-x-4 top-[16%] text-center">
        <span className="block font-hand text-[44px] leading-none font-bold [text-shadow:0_0_18px_rgba(255,120,170,.8)]">
          Hey you… <Heart className="inline size-7 align-baseline text-pink" filled={false} />
        </span>
        <span className="mt-3 block font-hand text-xl leading-snug opacity-95">I made a little world, just for us ♡</span>
      </span>
      <span className="absolute inset-x-8 top-[46%] rounded-full bg-[linear-gradient(180deg,#f06a92,#d93a64)] px-4 py-3 text-center font-bold shadow-[0_0_24px_rgba(240,90,140,.7)] transition group-hover:scale-105">Tap to try it ♡</span>
    </button>
  );
}
