"use client";

import { useState } from "react";
import { VivahMini } from "@/components/VivahMini";

/**
 * Store phone for the Shiv–Parvati invitation: a still of the opening screen until tapped, then
 * the live demo. Keeps the store's first load light (the invitation loads only for visitors who try it).
 */
export function VivahTeaser({ priority = false }: { priority?: boolean }) {
  const [live, setLive] = useState(false);
  return live ? (
    <iframe src="/demo/shiv-parvati" title="Interactive demo of the Shiv–Parvati wedding invitation" className="block aspect-[390/844] w-full bg-[#fbf4f1]" allow="autoplay" />
  ) : (
    <button type="button" onClick={() => setLive(true)} className="group relative block aspect-[390/844] w-full overflow-hidden text-[13px] sm:text-[14px]" aria-label="Try the Shiv–Parvati wedding invitation demo here" data-testid="vivah-teaser">
      <VivahMini priority={priority} />
      <span className="absolute inset-x-6 bottom-[5%] flex items-center justify-center gap-2 rounded-full bg-[rgba(24,14,10,.74)] px-4 py-3 text-center text-sm font-bold text-white shadow-[0_6px_24px_rgba(0,0,0,.35)] ring-1 ring-white/25 backdrop-blur-md transition group-hover:scale-105">
        <span aria-hidden="true">👆</span> Tap to open it
      </span>
    </button>
  );
}
