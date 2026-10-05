"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Landing-page phone: a still of the cover until tapped, then the live demo. Keeps the store's
 * first load light (the full experience only loads for visitors who want to try it).
 */
export function DemoTeaser() {
  const [live, setLive] = useState(false);
  return live ? (
    <iframe src="/demo" title="Interactive demo of a birthday website" className="block aspect-[9/17] w-full bg-baby" />
  ) : (
    <button type="button" onClick={() => setLive(true)} className="group relative block aspect-[9/17] w-full overflow-hidden bg-baby" aria-label="Try the interactive demo here">
      <Image src="/demo-poster.webp" alt="" fill sizes="280px" priority className="object-cover object-top" />
      <span className="absolute inset-x-6 bottom-6 rounded-lg bg-rose px-4 py-3 text-center font-bold text-white shadow-[3px_3px_0_var(--color-pink)] group-hover:bg-rose-dark">
        Tap to try it ♡
      </span>
    </button>
  );
}
