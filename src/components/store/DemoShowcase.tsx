"use client";

import Link from "next/link";
import { useState } from "react";
import { AskTeaser } from "@/components/AskTeaser";
import { DemoTeaser } from "@/components/DemoTeaser";
import { LoveStoryTeaser } from "@/components/LoveStoryTeaser";
import { WeddingTeaser } from "@/components/WeddingTeaser";
import type { ArtKind } from "@/lib/store";

export type DemoItem = { key: string; label: string; name: string; tagline: string; highlights: string[]; demo: string; href: string; art: ArtKind };

/** The real experiences, tap-to-load (each teaser swaps in its live demo route). */
function Teaser({ art }: { art: ArtKind }) {
  if (art === "scrapbook") return <DemoTeaser />;
  if (art === "lovestory") return <LoveStoryTeaser />;
  if (art === "wedding") return <WeddingTeaser />;
  return <AskTeaser />;
}

export function DemoShowcase({ items }: { items: DemoItem[] }) {
  const [active, setActive] = useState(items[0]?.key ?? "");
  const item = items.find((i) => i.key === active) ?? items[0];
  if (!item) return null;
  return (
    <div className="mt-8 grid items-center gap-10 md:grid-cols-[1fr_auto]">
      <div>
        <div role="tablist" aria-label="Choose a demo" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {items.map((i) => (
            <button
              key={i.key}
              role="tab"
              type="button"
              id={`demo-tab-${i.key}`}
              aria-selected={i.key === item.key}
              aria-controls="demo-panel"
              onClick={() => setActive(i.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${i.key === item.key ? "bg-wine text-white shadow-[0_8px_18px_-10px_rgba(74,29,44,.8)]" : "border border-wine/15 bg-white text-wine hover:border-wine/40"}`}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div id="demo-panel" role="tabpanel" aria-labelledby={`demo-tab-${item.key}`} className="mt-6">
          <h3 className="font-display text-2xl font-semibold text-wine sm:text-3xl">{item.name}</h3>
          <p className="mt-2 text-ink-soft">{item.tagline}. Tap the phone to play with the real thing — exactly what your person will receive.</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {item.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-baby text-[11px] text-rose">
                  ♥
                </span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={item.demo} target="_blank" className="inline-flex min-h-11 items-center rounded-xl bg-wine px-5 font-bold text-white transition hover:bg-rose">
              Open full demo ↗
            </Link>
            <Link href={item.href} className="inline-flex min-h-11 items-center rounded-xl border border-wine/20 bg-white px-5 font-bold text-wine transition hover:border-wine/50">
              See details
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto w-[260px] sm:w-[280px]">
        {/* key: switching tabs resets the teaser (no stale iframe from another product). */}
        <div key={item.key} className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#2a1219] bg-[#2a1219] shadow-[0_30px_60px_-28px_rgba(42,18,25,.7)]">
          <Teaser art={item.art} />
        </div>
      </div>
    </div>
  );
}
