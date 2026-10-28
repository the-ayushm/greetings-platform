import type { Metadata } from "next";
import Link from "next/link";
import { LoveStoryTeaser } from "@/components/LoveStoryTeaser";
import { ButtonLink, Card, Notice, formatINR } from "@/components/ui";
import { activeProduct } from "@/server/catalog";
import { Heart } from "@/templates/lovestory/art";
import { THEME_PRESETS } from "@/templates/lovestory/theme";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Little Universe — a personalised love story website",
  description: "Turn your relationship into an interactive love story website: little questions, your timeline, a photo scrapbook, special dates, a love letter, coupons and a final surprise. Share one private link.",
  openGraph: {
    title: "Our Little Universe — a personalised love story website",
    description: "An interactive, private love story website made by you, for one person. Perfect for birthdays, anniversaries and Valentine's Day.",
    type: "website",
  },
};

const SECTIONS: [n: string, title: string, body: string, at: string][] = [
  ["1", "Welcome under fairy lights", "“Hey you…” — your greeting, a night sky and your song, ready when they tap play.", "welcome"],
  ["2–3", "Little questions", "Do you remember when we first talked? What do you love most about us?", "quiz"],
  ["4", "“Are you sure? 🥺”", "Set a right answer and a wrong guess gets the cutest try-again page.", "quiz"],
  ["5", "Picture choice", "Which place feels most like us? Four of your own photos to pick from.", "quiz"],
  ["6", "Love slider", "How much do you love me? From “a little” to “a whole universe”.", "quiz"],
  ["7", "Their own words", "“What am I to you?” — optionally sent privately back to you.", "quiz"],
  ["8", "The envelope opens", "“You did it!” — a sealed envelope opens into your story.", "unlock"],
  ["9", "Our story timeline", "Your milestones with dates, words and polaroids.", "timeline"],
  ["10", "Memories scrapbook", "Up to 30 photos with captions, dates and filters like “Silly Moments”.", "scrapbook"],
  ["11", "Special dates calendar", "Hearts on your dates. Yearly ones repeat; it opens on the next one coming up.", "calendar"],
  ["12", "Love letter", "Tabs for Reasons I Love You, My Promises, Our Future and more.", "letter"],
  ["13", "Love coupons", "One Tight Hug, Movie Date… they tap to redeem, with a happy little stamp.", "coupons"],
  ["14", "Photo wall", "Polaroids hanging on a string of warm lights.", "photowall"],
  ["15", "You are my everything", "A glowing heart, your last words and “Spend Forever Together”.", "final"],
];

const FAQ = [
  { q: "Do they need an app or an account?", a: "No. They open your private link on any phone or computer — it just works, straight from WhatsApp or Instagram." },
  { q: "Can I add our own photos?", a: "Yes — up to 80 photos per story, straight from your phone (iPhone HEIC photos are converted automatically). Location data is removed from every photo, and photos are never public files." },
  { q: "Can I change it after sharing?", a: "Yes. Edit any time during your editing window, press Publish again, and the same link shows the new version. You can also unpublish or delete it." },
  { q: "Will I see what they answer?", a: "Only if you switch on “Collect their responses”. Then their typed answers, love-slider choice and redeemed coupons are sent privately to you — and the page tells them so. It's off by default." },
  { q: "Can someone else find it?", a: "No. Every story has a long random link, is hidden from search engines, and can have a passcode. Link previews never show names or photos." },
  { q: "Can I use any song?", a: "Upload a song you have the right to share privately, or use our original music-box tune. Music only plays when they tap." },
];

export default async function LoveStoryProductPage() {
  const p = await activeProduct("lovestory");
  const price = p ? formatINR(p.price_paise) : null;
  const buy = p ? `/checkout?product=${p.id}` : null;
  return (
    <main>
      {/* hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#1a0d2e_0%,#4a0f2a_55%,#5c0f22_100%)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(2px_2px_at_10%_20%,#fff,transparent),radial-gradient(1.5px_1.5px_at_30%_70%,#fff,transparent),radial-gradient(2px_2px_at_55%_15%,#fff,transparent),radial-gradient(1.5px_1.5px_at_80%_40%,#fff,transparent),radial-gradient(2px_2px_at_92%_80%,#fff,transparent),radial-gradient(160px_160px_at_85%_20%,rgba(255,140,190,.18),transparent)] opacity-70" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <p className="font-hand text-2xl text-[#ffb3cb]">new · a love story they can open ♡</p>
            <h1 className="mt-2 font-display text-4xl leading-tight font-semibold sm:text-5xl">Our Little Universe</h1>
            <p className="mt-2 font-display text-xl italic text-[#ffd6e2]">A personalised love story website, made just for the two of you.</p>
            <p className="mt-4 max-w-prose text-lg text-white/85">Your photos, your dates, your words — turned into an interactive little world: sweet questions, your timeline, a scrapbook, a love letter, coupons and a final surprise. Shared as one private link.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {buy ? (
                <ButtonLink href={buy} className="shadow-[0_0_24px_rgba(240,90,140,.55)]" data-testid="love-buy">
                  Create Your Love Story{price ? ` · ${price}` : ""}
                </ButtonLink>
              ) : (
                <span className="rounded-lg bg-white/15 px-5 py-2.5 font-bold">Sales are paused for a moment</span>
              )}
              <ButtonLink href="/demo/love-story" variant="secondary" target="_blank">
                Try the demo
              </ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Perfect for">
              {["Birthdays", "Anniversaries", "Valentine's Day", "Proposals", "Milestones", "Just because"].map((t) => (
                <li key={t} className="rounded-full border border-white/25 bg-white/10 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#1b0a14] bg-[#1b0a14] shadow-[0_0_40px_rgba(240,90,140,.35),8px_8px_0_#f59ab8]">
              <LoveStoryTeaser />
            </div>
            <p className="mt-3 text-center font-hand text-xl text-white/80">a real one, try it ♡</p>
          </div>
        </div>
      </section>

      {/* sections */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="inside">
        <h2 id="inside" className="font-display text-3xl font-semibold">Fifteen little pages, one big feeling</h2>
        <p className="mt-2 max-w-prose text-ink-soft">Every page is yours to edit, reorder or switch off. Tap any of them to open that page in the live demo.</p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(([n, t, b, at]) => (
            <li key={n}>
              <Link href={`/demo/love-story?at=${at}`} target="_blank" className="group block h-full rounded-2xl border-2 border-ink/80 bg-white p-5 shadow-[5px_5px_0_var(--color-blush)] transition hover:-translate-y-0.5">
                <span className="font-pixel text-sm text-rose">{n}</span>
                <h3 className="mt-1 font-display text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{b}</p>
                <span className="mt-3 inline-block text-sm font-bold text-rose group-hover:underline">Preview →</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* customization */}
      <section className="bg-white/70 py-14" aria-labelledby="custom">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="custom" className="font-display text-3xl font-semibold">Make it completely yours — no code</h2>
          <p className="mt-2 max-w-prose text-ink-soft">A visual studio with a live preview on mobile and desktop. Everything saves automatically as you go.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]).map((k) => {
              const t = THEME_PRESETS[k];
              return (
                <li key={k} className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-white">
                  <div className="relative h-24" style={{ background: `linear-gradient(160deg, ${t.palette.background}, ${t.palette.primary})` }}>
                    <div className="absolute inset-x-6 top-5 bottom-0 rounded-t-xl p-3" style={{ background: t.palette.paper, color: t.palette.text }}>
                      <p className="font-hand text-xl leading-none font-bold">
                        Our Story <Heart className="inline size-4" filled={false} style={{ color: t.palette.primary }} />
                      </p>
                      <span className="mt-2 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold text-white" style={{ background: t.palette.button }}>
                        Next →
                      </span>
                    </div>
                  </div>
                  <p className="px-4 py-3 font-bold">{t.label}</p>
                </li>
              );
            })}
            <li className="rounded-2xl border-2 border-dashed border-ink/25 bg-cream p-4">
              <p className="font-bold">…or your own colours</p>
              <p className="mt-1 text-sm text-ink-soft">Pick any primary, button, paper and background colour, fonts, borders, hearts, sparkles and animation level.</p>
            </li>
          </ul>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Your details & words", "Names, dates, your greeting, every heading and message, your letter with simple formatting."],
              ["Your photos & song", "Upload from your phone with progress, captions and dates; reorder and reuse photos in any section. Add your song or use our music box."],
              ["Your questions", "Multiple choice, picture choice, love slider or free text. Choose a right answer — or let every answer be right."],
            ].map(([t, b]) => (
              <Card key={t}>
                <h3 className="font-pixel text-lg text-rose">{t}</h3>
                <p className="mt-2 text-ink-soft">{b}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Buy & sign in", `Pay securely with UPI, card or netbanking (Razorpay)${price ? ` — ${price} one time` : ""}. Sign in with a link sent to your email.`],
            ["Create in the studio", "Add your names, photos, questions, dates, letter and coupons — and watch your story come alive in the live preview."],
            ["Share one link", "Publish, then copy your private link or send it on WhatsApp or Instagram. They open it — no app, no account."],
          ].map(([t, b], i) => (
            <li key={t} className="rounded-2xl border-2 border-dashed border-pink bg-cream p-5">
              <span className="font-pixel text-3xl text-rose" aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className="mt-1 text-lg font-extrabold">{t}</h3>
              <p className="mt-1 text-ink-soft">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* mobile + privacy */}
      <section className="bg-white/70 py-14" aria-labelledby="mobile">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <Card>
            <h2 id="mobile" className="font-display text-2xl font-semibold">Made for their phone</h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              <li>• Designed mobile-first — big buttons, swipeable photo wall, readable letters</li>
              <li>• Opens straight from WhatsApp, Instagram or any messenger</li>
              <li>• Light on data: photos are resized and load as they scroll</li>
              <li>• Calm, still version for anyone who prefers reduced motion</li>
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-2xl font-semibold">Private by design</h2>
            <ul className="mt-4 space-y-2 text-ink-soft">
              <li>• A long, random link nobody can guess — plus an optional passcode</li>
              <li>• Hidden from Google; link previews never show names or photos</li>
              <li>• Location data removed from every photo; photos are never public files</li>
              <li>• Unpublish, change the link or delete everything any time</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* pricing */}
      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6" aria-labelledby="pricing">
        <h2 id="pricing" className="text-center font-display text-3xl font-semibold">
          Pricing
        </h2>
        {!p ? (
          <div className="mt-6">
            <Notice tone="error">Sales are paused for a moment. Please check back soon.</Notice>
          </div>
        ) : (
          <Card className="mt-6">
            <p className="font-display text-xl font-semibold">{p.name}</p>
            <p className="mt-1 font-pixel text-4xl text-rose">{price}</p>
            <p className="text-sm text-ink-soft">one-time payment · GST as applicable</p>
            <ul className="mt-5 space-y-2">
              <li>✓ All 15 pages, fully customisable — reorder or switch any off</li>
              <li>✓ Up to 80 photos, your song or our music box</li>
              <li>✓ Your own private link (and QR code), optional passcode</li>
              <li>
                ✓ Edit for {p.edit_days} days, live for {p.live_days >= 365 ? `${Math.round(p.live_days / 365)} year${p.live_days >= 730 ? "s" : ""}` : `${p.live_days} days`}
              </li>
              <li>✓ Optional private responses from them, only to you</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={buy!}>Create Your Love Story</ButtonLink>
              <ButtonLink href="/demo/love-story" variant="secondary" target="_blank">
                See the demo first
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              After payment you go straight to the customization studio — your story is created as soon as Razorpay confirms the payment. By buying you agree to our{" "}
              <Link className="underline" href="/legal/terms">
                terms
              </Link>{" "}
              and{" "}
              <Link className="underline" href="/legal/refund">
                refund policy
              </Link>
              .
            </p>
          </Card>
        )}
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-4 pb-6 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-3xl font-semibold">Questions</h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl border-2 border-ink/15 bg-white px-4 py-3">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        {buy && (
          <div className="mt-10 text-center">
            <ButtonLink href={buy}>Start your love story ♡</ButtonLink>
          </div>
        )}
      </section>
    </main>
  );
}
