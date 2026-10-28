"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Product-page phone: a still of the sealed envelope until tapped, then the live demo. Keeps
 * the store's first load light (the invitation loads only for visitors who try it).
 */
export function WeddingTeaser() {
  const [live, setLive] = useState(false);
  return live ? (
    <iframe src="/demo/wedding" title="Interactive demo of the wedding invitation" className="block aspect-[390/844] w-full bg-[#351018]" />
  ) : (
    <button type="button" onClick={() => setLive(true)} className="group relative block aspect-[390/844] w-full overflow-hidden" aria-label="Try the interactive wedding invitation demo here" data-testid="wedding-teaser">
      <Image src="/products/wedding/envelope.webp" alt="" fill sizes="300px" className="object-cover" fetchPriority="high" />
      <span className="absolute inset-x-8 bottom-[16%] rounded-full bg-[linear-gradient(180deg,#d9b778,#b88f4f)] px-4 py-3 text-center font-bold text-[#351018] shadow-[0_0_24px_rgba(201,162,95,.6)] transition group-hover:scale-105">Tap to open it ♡</span>
    </button>
  );
}
