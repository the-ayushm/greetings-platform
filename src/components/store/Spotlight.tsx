import Link from "next/link";
import { VivahTeaser } from "@/components/VivahTeaser";
import { priceLabel, type StoreProduct } from "@/lib/store";

/** Homepage lead banner for the Shiv–Parvati wedding invitation (price and links from the live product). */
export function Spotlight({ p }: { p: StoreProduct }) {
  const price = priceLabel(p.pricePaise);
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_85%_0%,#fff4f6_0%,#f8dde3_45%,#eec3cd_100%)]" aria-labelledby="spotlight" data-testid="spotlight">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_240px_at_90%_20%,rgba(255,255,255,.75),transparent),radial-gradient(320px_240px_at_0%_100%,rgba(184,134,47,.2),transparent)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:pt-14 md:pb-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-extrabold tracking-[0.14em] text-[#9a1d45] uppercase shadow-sm">
            <span aria-hidden="true">🔱</span> New · Wedding season special
          </p>
          <h2 id="spotlight" className="mt-4 font-display text-[2.4rem] leading-[1.05] font-semibold text-[#36101c] sm:text-6xl">
            Your wedding invitation, <span className="text-[#9a1d45] italic">blessed by Mahadev</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#55303b]">
            A divine Shiv–Parvati invitation your guests open straight from WhatsApp — your names and families, every function with maps, your photos, your song, and RSVPs that come to your WhatsApp.
          </p>
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-5xl font-semibold text-[#9a1d45]">{price}</span>
            <span className="text-sm font-semibold text-[#55303b]">only · one time · ready in 10 minutes</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/checkout?product=${p.id}`} className="inline-flex min-h-12 items-center rounded-2xl bg-[#9a1d45] px-6 text-base font-bold text-white shadow-[0_14px_28px_-14px_rgba(154,29,69,.9)] transition hover:bg-[#741225]" data-testid="spotlight-buy">
              Create your invitation · {price}
            </Link>
            <Link href={p.meta.demo} target="_blank" className="inline-flex min-h-12 items-center rounded-2xl border border-[#9a1d45]/25 bg-white/80 px-6 text-base font-bold text-[#9a1d45] transition hover:border-[#9a1d45]/60">
              See the live demo ↗
            </Link>
          </div>
          <ul className="mt-6 grid max-w-xl grid-cols-2 gap-x-5 gap-y-2 text-sm font-semibold text-[#55303b]" aria-label="What you get">
            {["✓ Your names & families", "✓ Haldi to reception", "✓ Your photos & song", "✓ RSVP on WhatsApp"].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link href={p.meta.href} className="mt-5 inline-block text-sm font-bold text-[#9a1d45] underline underline-offset-4">
            Everything it includes →
          </Link>
        </div>
        <div className="mx-auto w-[250px] sm:w-[280px]">
          <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#2a1219] bg-[#2a1219] shadow-[0_30px_60px_-28px_rgba(42,18,25,.7),8px_8px_0_#e8b4c0]">
            <VivahTeaser priority />
          </div>
          <p className="mt-3 text-center font-display text-lg text-[#741225] italic">tap the phone — it&apos;s the real thing ♡</p>
        </div>
      </div>
    </section>
  );
}
