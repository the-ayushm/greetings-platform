import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskMini, type MiniScreen } from "@/components/AskMini";
import { AskTeaser } from "@/components/AskTeaser";
import { ButtonLink, Card, Notice, formatINR } from "@/components/ui";
import { canSeeUnlisted, currentUser } from "@/server/auth";
import { activeProduct, storeProduct } from "@/server/catalog";
import { appOrigin } from "@/server/env";
import { Buddy } from "@/templates/doyouloveme/art";
import { THEME_PRESETS } from "@/templates/doyouloveme/theme";

export const dynamic = "force-dynamic";

const PATH = "/products/do-you-love-me";
const CATEGORY = "Romantic Interactive Websites";

/** Customers see the product once it's on sale; until then only MFA'd admins can open this page. */
async function load() {
  return storeProduct("doyouloveme", await canSeeUnlisted(await currentUser()));
}

export async function generateMetadata(): Promise<Metadata> {
  const p = await load();
  const title = p?.name ?? "Do You Love Me? ❤️";
  const description = p?.description ?? "A playful little question that turns into the sweetest romantic surprise.";
  const url = `${appOrigin()}${PATH}`;
  const image = `${appOrigin()}/og/do-you-love-me.png`;
  return {
    title: `${title} — Interactive Romantic Website`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "A little card asking “Do you love me?” with a big green Yes and a tiny red No" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    // Not on sale yet (admin testing): keep it out of search engines.
    robots: p?.is_active ? undefined : { index: false, follow: false },
  };
}

const STRIP: [screen: MiniScreen, caption: string][] = [
  [{ kind: "ask", step: 0 }, "They open your link — one sweet question."],
  [{ kind: "ask", step: 1 }, "“No”? The button begs: “Are you sure?” — and YES grows."],
  [{ kind: "ask", step: 7 }, "Every “No” makes YES bigger and your buddy sadder."],
  [{ kind: "takeover" }, "Until YES fills the whole screen. Only one answer left ♡"],
  [{ kind: "finale" }, "YES! Hearts, confetti, your message, your photo, your song."],
];

const HIGHLIGHTS: [title: string, body: string][] = [
  ["Interactive YES / NO", "A real question with two buttons — and a No that never quite works out the way they planned."],
  ["YES that keeps growing", "Each “No” changes the No button's words and grows YES, smoothly, until it takes over the screen."],
  ["Your own words", "Their name, your question, every “No” line, the final heading and a love message — all yours."],
  ["A celebration to remember", "A burst of hearts, falling confetti, a happy dancing buddy, your photo and an optional song."],
  ["Made for phones", "Opens straight from WhatsApp or Instagram. Big touch targets, no app, works on any screen."],
  ["Your look", "Four palettes or your own colours, four original characters, and calm-to-extra animation."],
  ["Shareable & private", "A private link and QR code, optional passcode, hidden from search engines. Know when they say yes."],
];

const FAQ = [
  { q: "Can they actually press No?", a: "Yes — No always works and is never hidden behind anything. It just changes its mind with every press (“Are you sure?”, “Last chance!”…) while YES grows. After your last line, YES fills the screen." },
  { q: "Can I ask a different question?", a: "Absolutely. “Will you be my Valentine?”, “Will you marry me?”, “Can we go on a date?” — change the question, the buttons and every line." },
  { q: "Do they need an app or an account?", a: "No. They open your link on any phone or computer — straight from WhatsApp, Instagram or a text message." },
  { q: "Will I know what they answered?", a: "If you keep “Tell me when they say YES” on, your dashboard shows their answer and how many times they pressed “No” first. Nothing else about them is stored." },
  { q: "Does music play by itself?", a: "Never on page load. It can start when they press YES (that tap is their permission), and there's always a sound button." },
  { q: "Can I edit it after sending?", a: "Yes. Edit during your editing window and press Publish again — the same link shows the update." },
];

export default async function DoYouLoveMeProductPage() {
  const p = await load();
  if (!p) notFound();
  const [love, wedding, birthday] = await Promise.all([activeProduct("lovestory"), activeProduct("wedding"), activeProduct()]);
  const free = p.price_paise === 0;
  const price = free ? "Free" : formatINR(p.price_paise);
  const buy = `/checkout?product=${p.id}`;
  const live = p.live_days >= 365 ? `${Math.round(p.live_days / 365)} year${p.live_days >= 730 ? "s" : ""}` : `${p.live_days} days`;
  // Structured data only for a product that is really on sale (never for the admin test view).
  const ld = p.is_active
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        description: p.description,
        category: CATEGORY,
        url: `${appOrigin()}${PATH}`,
        image: `${appOrigin()}/og/do-you-love-me.png`,
        offers: { "@type": "Offer", price: (p.price_paise / 100).toFixed(2), priceCurrency: p.currency, availability: "https://schema.org/InStock", url: `${appOrigin()}${PATH}` },
      }).replace(/</g, "\\u003c")
    : null;
  const related = [
    love && { href: "/products/love-story", title: "Our Little Universe", body: "A whole love story website: questions, timeline, scrapbook, love letter and more." },
    birthday && { href: "/product", title: "Birthday Scrapbook Surprise", body: "A letter in an envelope, polaroids, coupons and a cupcake wish." },
    wedding && { href: "/products/wedding-invitation", title: "Royal Burgundy wedding invitation", body: "An envelope that opens in golden light, countdown, schedule and RSVPs." },
  ].filter(Boolean) as { href: string; title: string; body: string }[];

  return (
    <main>
      {/* JSON-LD data block (never executed). Built from our own catalog row with every "<" escaped. */}
      {/* eslint-disable-next-line react/no-danger */}
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
      {!p.is_active && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
          <Notice>
            <b>Testing mode — only admins can see this page.</b> This product isn&apos;t on sale yet. Set its price and put it on sale in{" "}
            <Link className="font-bold underline" href="/admin/catalog">
              Admin → Templates &amp; pricing
            </Link>
            .
          </Notice>
        </div>
      )}

      {/* hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#ffc4cf_0%,#ffe1e6_45%,#fff0ea_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_240px_at_88%_12%,rgba(255,255,255,.7),transparent),radial-gradient(320px_260px_at_6%_92%,rgba(224,68,95,.16),transparent)]" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
              <Link href="/" className="underline-offset-2 hover:underline">
                Home
              </Link>{" "}
              › <span>{CATEGORY}</span>
            </nav>
            <p className="mt-3 font-hand text-2xl text-rose">a playful little question ♡</p>
            <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">{p.name}</h1>
            <p className="mt-4 max-w-prose text-lg text-ink-soft">{p.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={buy} data-testid="ask-buy">
                Make yours · {price}
              </ButtonLink>
              <ButtonLink href="/demo/do-you-love-me" variant="secondary" target="_blank" data-testid="ask-demo">
                Try the live demo
              </ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm font-bold" aria-label="Highlights">
              {["Mobile-first", "Opens from WhatsApp", "Your words", "Your colours", "Private link"].map((t) => (
                <li key={t} className="rounded-full border-2 border-white bg-white/60 px-3 py-1 text-ink">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-ink bg-ink shadow-[0_30px_60px_-30px_rgba(91,35,51,.6),8px_8px_0_var(--color-pink)]">
              <AskTeaser />
            </div>
            <p className="mt-3 text-center font-hand text-xl text-ink-soft">a real one — go on, press No ♡</p>
          </div>
        </div>
      </section>

      {/* the sequence */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="sequence">
        <h2 id="sequence" className="font-display text-3xl font-semibold">How every “No” plays out</h2>
        <p className="mt-2 max-w-prose text-ink-soft">No always works — it just changes its mind. Tap any screen to open it in the demo.</p>
        <ol className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {STRIP.map(([screen, caption], i) => (
            <li key={caption} className="w-[46%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/demo/do-you-love-me${screen.kind === "ask" ? "" : `?at=${screen.kind}`}`}
                target="_blank"
                className="block overflow-hidden rounded-[1.4rem] border-[6px] border-ink bg-ink shadow-[5px_5px_0_var(--color-blush)] transition hover:-translate-y-1"
                aria-label={`Step ${i + 1}: ${caption} Open in the demo`}
              >
                <AskMini screen={screen} className="aspect-[390/700] text-[9px] sm:text-[8px] lg:text-[10px]" />
              </Link>
              <p className="mt-2 text-sm">
                <span className="font-pixel text-rose">{String(i + 1).padStart(2, "0")}</span> {caption}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* highlights */}
      <section className="bg-white/70 py-14" aria-labelledby="highlights">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="highlights" className="font-display text-3xl font-semibold">Small question, big feelings</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map(([t, b]) => (
              <li key={t}>
                <Card className="h-full">
                  <h3 className="font-pixel text-lg text-rose">{t}</h3>
                  <p className="mt-2 text-ink-soft">{b}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* customise */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="custom">
        <h2 id="custom" className="font-display text-3xl font-semibold">Make it yours — no code</h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          A visual studio with a live phone preview. Change their name, the question, the Yes and No buttons, every “No” line (up to 20), the celebration heading, your love message and signature, a photo, the music, colours, character and how much it all sparkles.
        </p>
        <h3 className="mt-8 text-lg font-extrabold">Four original characters</h3>
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:max-w-xl">
          {(["bunny", "bear", "kitty", "mochi"] as const).map((k) => (
            <li key={k} className="rounded-2xl border-2 border-ink/10 bg-white p-3 text-center text-sm font-bold capitalize">
              <Buddy kind={k} mood="ask" className="mx-auto w-full max-w-24" />
              {k}
            </li>
          ))}
        </ul>
        <h3 className="mt-8 text-lg font-extrabold">Palettes — or your own colours</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(THEME_PRESETS).map((t) => (
            <li key={t.label} className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-white">
              <div className="flex h-20 items-center justify-center gap-2" style={{ background: `linear-gradient(150deg, ${t.palette.bg1}, ${t.palette.bg2})` }}>
                <span className="rounded-xl px-4 py-2 text-sm font-black text-white" style={{ background: t.palette.yes }}>
                  Yes
                </span>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white" style={{ background: t.palette.no }}>
                  No
                </span>
              </div>
              <p className="px-4 py-3 font-bold">{t.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* mobile */}
      <section className="bg-white/70 py-14" aria-labelledby="mobile">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="mobile" className="font-display text-3xl font-semibold">Made for the phone in their hand</h2>
            <p className="mt-2 max-w-prose text-ink-soft">
              Most links are opened from WhatsApp or Instagram, so it&apos;s designed phone-first: big, comfortable buttons that never overlap, a full-screen YES that works in in-app browsers, and gentle motion that respects “reduce motion”. On a laptop it looks just as lovely.
            </p>
            <ul className="mt-4 space-y-1.5 text-ink-soft">
              <li>✓ No app, no sign-up for them</li>
              <li>✓ Link previews never show names or photos</li>
              <li>✓ Music only after they tap — never on its own</li>
            </ul>
          </div>
          <div className="mx-auto flex gap-4" aria-hidden="true">
            {(
              [
                { kind: "takeover" },
                { kind: "finale" },
              ] as MiniScreen[]
            ).map((s) => (
              <div key={s.kind} className="w-36 overflow-hidden rounded-[1.6rem] border-[7px] border-ink bg-ink shadow-[6px_6px_0_var(--color-pink)] sm:w-44">
                <AskMini screen={s} className="aspect-[390/844] text-[9px] sm:text-[11px]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Get it & sign in", free ? "Sign in with a link sent to your email — no payment needed." : `Pay securely with UPI, card or netbanking (Razorpay) — ${price} one time. Sign in with a link sent to your email.`],
            ["Personalise", "Add their name, your question and your message in the studio — press No in the live preview to see it play out."],
            ["Send the link", "Publish and send your private link on WhatsApp or Instagram. Your dashboard tells you when they say YES."],
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

      {/* pricing */}
      <section className="mx-auto max-w-xl px-4 pb-14 sm:px-6" aria-labelledby="pricing">
        <h2 id="pricing" className="text-center font-display text-3xl font-semibold">
          Pricing
        </h2>
        <Card className="mt-6">
          <p className="font-display text-xl font-semibold">{p.name}</p>
          <p className="mt-1 font-pixel text-4xl text-rose" data-testid="ask-price">
            {price}
          </p>
          <p className="text-sm text-ink-soft">{free ? "no payment needed" : "one-time payment · GST as applicable"}</p>
          <ul className="mt-5 space-y-2">
            <li>✓ Every word, colour and character customisable</li>
            <li>✓ Up to 20 “No” lines and a full-screen YES</li>
            <li>✓ Celebration with your message, photo and song</li>
            <li>✓ Your own private link (and QR code), optional passcode</li>
            <li>
              ✓ Edit for {p.edit_days} days, live for {live}
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={buy}>Make yours</ButtonLink>
            <ButtonLink href="/demo/do-you-love-me" variant="secondary" target="_blank">
              See the demo first
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            By continuing you agree to our{" "}
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
        <div className="mt-10 text-center">
          <ButtonLink href={buy}>Ask them ♡</ButtonLink>
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6" aria-labelledby="related">
          <h2 id="related" className="font-display text-2xl font-semibold">More romantic surprises</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="block h-full rounded-2xl border-2 border-ink/15 bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/40">
                  <h3 className="font-display text-lg font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
                  <span className="mt-2 inline-block text-sm font-bold text-rose">See it →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
