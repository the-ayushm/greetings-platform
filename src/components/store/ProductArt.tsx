import Image from "next/image";
import { AskMini } from "@/components/AskMini";
import type { ArtKind } from "@/lib/store";
import { CoupleBack, Heart, Skyline } from "@/templates/lovestory/art";

/**
 * The first screen of each product, drawn for the store (real stills or the template's own
 * vector art — never stock). Fills its parent; put it inside <Phone>.
 */
export function ProductScreen({ art, priority = false }: { art: ArtKind; priority?: boolean }) {
  if (art === "scrapbook") return <Image src="/demo-poster.webp" alt="" fill sizes="(max-width: 640px) 40vw, 200px" priority={priority} unoptimized className="object-cover object-top" />;
  if (art === "wedding") return <Image src="/products/wedding/cover.webp" alt="" fill sizes="(max-width: 640px) 40vw, 200px" priority={priority} unoptimized className="object-cover object-top" />;
  if (art === "ask") return <AskMini screen={{ kind: "ask", step: 3 }} className="absolute inset-0 text-[8px] sm:text-[9px]" />;
  return (
    <span className="absolute inset-0 overflow-hidden text-white">
      <span className="absolute inset-0 bg-[linear-gradient(180deg,#0d0b2a_0%,#3a1440_55%,#5c0f22_100%)]" />
      <span className="absolute inset-x-0 top-0 h-10 bg-[radial-gradient(4px_5px_at_10%_40%,#ffd27a,transparent),radial-gradient(4px_5px_at_30%_62%,#ffd27a,transparent),radial-gradient(4px_5px_at_50%_48%,#ffd27a,transparent),radial-gradient(4px_5px_at_70%_62%,#ffd27a,transparent),radial-gradient(4px_5px_at_90%_46%,#ffd27a,transparent)]" />
      <Skyline className="absolute inset-x-0 bottom-[22%] h-[26%] w-full opacity-90" />
      <CoupleBack className="absolute bottom-0 left-1/2 w-[96%] -translate-x-1/2" />
      <span className="absolute inset-x-2 top-[17%] text-center">
        <span className="block font-hand text-[1.9em] leading-none font-bold [text-shadow:0_0_14px_rgba(255,120,170,.8)]">
          Hey you… <Heart className="inline size-[0.8em] align-baseline text-pink" filled={false} />
        </span>
        <span className="mt-1 block font-hand text-[1em] leading-snug opacity-95">A little world, just for us ♡</span>
      </span>
    </span>
  );
}

/** A slim phone frame (9:19.5) around a product screen. */
export function Phone({ art, className = "", priority = false }: { art: ArtKind; className?: string; priority?: boolean }) {
  return (
    <span className={`block aspect-[9/19.5] overflow-hidden rounded-[1.6em] border-[0.45em] border-[#2a1219] bg-[#2a1219] shadow-[0_24px_40px_-18px_rgba(42,18,25,.55)] ${className}`} aria-hidden="true">
      <span className="relative block size-full overflow-hidden rounded-[1.15em]">
        <ProductScreen art={art} priority={priority} />
      </span>
    </span>
  );
}

/** Card thumbnail: the product's colours with its phone standing in the middle. */
export function ProductThumb({ art, tint, className = "" }: { art: ArtKind; tint: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${tint} ${className}`}>
      <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(255,255,255,.55),transparent_70%)]" />
      <Phone art={art} className="absolute top-[9%] left-1/2 w-[38%] text-[13px] -translate-x-1/2 transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-2deg]" />
    </div>
  );
}
