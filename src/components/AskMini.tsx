import { Buddy, Heart, moodFor } from "@/templates/doyouloveme/art";
import { DEMO_CONTENT } from "@/templates/doyouloveme/defaults";
import { THEME_PRESETS } from "@/templates/doyouloveme/theme";

/**
 * Store-side miniature of the "Do You Love Me?" screens (a drawing, not the live page): used for
 * the product card, the hero poster and the "how No plays out" strip. Pure markup + the
 * template's own SVG character, so it needs no images and works in server components.
 */

const P = THEME_PRESETS.rose.palette;
const MSGS = DEMO_CONTENT.question.noMessages;

export type MiniScreen = { kind: "ask"; step: number } | { kind: "takeover" } | { kind: "finale" };

export function AskMini({ screen, className = "" }: { screen: MiniScreen; className?: string }) {
  const bg = `linear-gradient(155deg, ${P.bg1}, ${P.bg2})`;
  if (screen.kind === "takeover")
    return (
      <div className={`relative grid place-items-center overflow-hidden text-white ${className}`} style={{ background: `radial-gradient(120% 85% at 50% 38%, #4fb88f, ${P.yes} 55%, #177856)` }} aria-hidden="true">
        <div className="text-center">
          <p className="text-[3.4em] leading-none font-black drop-shadow-[0_6px_20px_rgba(0,0,0,.2)]">Yes</p>
          <p className="mt-2 font-hand text-[1.15em] opacity-90">There&apos;s only one answer now ♡</p>
        </div>
      </div>
    );
  if (screen.kind === "finale")
    return (
      <div className={`relative flex flex-col items-center justify-center overflow-hidden px-[8%] text-center ${className}`} style={{ background: bg, color: P.ink }} aria-hidden="true">
        {[12, 30, 58, 76, 88].map((l, i) => (
          <Heart key={l} className="absolute w-[1.2em]" style={{ left: `${l}%`, bottom: `${8 + ((i * 23) % 50)}%`, color: i % 2 ? "#fff" : P.accent, opacity: i % 2 ? 0.8 : 0.35 }} />
        ))}
        <Buddy kind="bunny" mood="happy" className="w-[42%]" />
        <p className="mt-1 font-hand text-[2.3em] leading-none font-bold" style={{ color: P.accent }}>
          I knew it! ❤️
        </p>
        <p className="mt-1 font-display text-[.95em] italic">You just made my heart the happiest!</p>
        <div className="mt-3 w-full rounded-[1em] border border-white/80 bg-white/70 px-3 py-2 text-[.7em] leading-snug">Every day with you feels like my favourite day…</div>
      </div>
    );
  const step = Math.min(screen.step, MSGS.length);
  const g = step / MSGS.length;
  return (
    <div className={`relative grid place-items-center overflow-hidden px-[7%] ${className}`} style={{ background: bg, color: P.ink }} aria-hidden="true">
      <div className="w-full rounded-[1.4em] border border-white/90 bg-white/75 px-[7%] py-[9%] text-center shadow-[0_18px_40px_-22px_rgba(91,35,51,.45)]">
        <p className="font-hand text-[1.05em] leading-none font-bold" style={{ color: P.accent }}>
          Hey Riya…
        </p>
        <p className="mt-1 font-hand text-[1.9em] leading-none font-bold">Do you love me?</p>
        <Buddy kind="bunny" mood={moodFor(step, MSGS.length)} className="mx-auto my-[5%] w-[40%]" />
        <div className="flex flex-wrap items-center justify-center gap-[.5em]">
          <span
            className="inline-block rounded-[.8em] font-black text-white shadow-[0_8px_16px_-8px_rgba(31,158,110,.7)]"
            style={{ background: `linear-gradient(180deg,#4cb68c,${P.yes} 55%,#18805a)`, fontSize: `${0.85 + g * 1.5}em`, padding: `${0.5 + g * 0.35}em ${1.3 - g * 0.25}em` }}
          >
            Yes
          </span>
          <span className="inline-block rounded-full px-[.9em] py-[.45em] font-extrabold text-white" style={{ background: P.no, fontSize: `${0.75 - g * 0.15}em` }}>
            {step === 0 ? "No" : MSGS[step - 1]}
          </span>
        </div>
      </div>
    </div>
  );
}
