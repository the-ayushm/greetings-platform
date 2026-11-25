import Image from "next/image";

const A = "/vivah-assets/illus";

/**
 * The invitation's opening screen, drawn for the store from the template's own artwork: the sky,
 * Shiv's hand rising from below, Parvati's foot stepping down, and the sample couple's names.
 * Fills its parent (font-size scales the text).
 */
export function VivahMini({ priority = false, names = "Rudra & Gauri" }: { priority?: boolean; names?: string }) {
  return (
    <span className="absolute inset-0 block overflow-hidden bg-[#f3dce4]">
      <Image src={`${A}/shiv-sky.jpg`} alt="" fill sizes="(max-width: 640px) 40vw, 240px" priority={priority} unoptimized className="object-cover" />
      <span className="absolute top-[-4%] right-[-30%] block aspect-[788/890] w-[100%]">
        <Image src={`${A}/shiv-parvati-step.webp`} alt="" fill sizes="240px" unoptimized className="object-contain" />
      </span>
      <span className="absolute top-[52%] left-[-14%] block aspect-[1100/618] w-[124%]">
        <Image src={`${A}/shiv-hand.webp`} alt="" fill sizes="240px" unoptimized className="object-contain" />
      </span>
      <span className="absolute inset-x-[6%] top-[73%] block text-center">
        <span className="block font-display text-[0.95em] leading-tight font-bold tracking-[0.06em] text-[#741225] uppercase [text-shadow:0_0_10px_rgba(255,250,252,.95)]">
          Written by destiny,
          <br />
          blessed by Mahadev
        </span>
        <span className="mt-[0.2em] block font-display text-[2.1em] leading-none text-[#9a1d45] italic [text-shadow:0_0_14px_rgba(255,250,252,.95)]">{names}</span>
      </span>
    </span>
  );
}
