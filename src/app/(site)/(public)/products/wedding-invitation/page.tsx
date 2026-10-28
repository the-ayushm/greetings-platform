import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WeddingTeaser } from "@/components/WeddingTeaser";
import { ButtonLink, Card, Notice, formatINR } from "@/components/ui";
import { canSeeUnlisted, currentUser } from "@/server/auth";
import { storeProduct } from "@/server/catalog";
import { appOrigin } from "@/server/env";
import { THEME_PRESETS } from "@/templates/wedding/theme";

export const dynamic = "force-dynamic";

const PATH = "/products/wedding-invitation";

/** Customers see the product once it's on sale; until then only MFA'd admins can open this page. */
async function load() {
  return storeProduct("wedding", await canSeeUnlisted(await currentUser()));
}

export async function generateMetadata(): Promise<Metadata> {
  const p = await load();
  const title = p?.name ?? "Royal Burgundy — Interactive Wedding Invitation Website";
  const description = p?.description ?? "An elegant, interactive wedding invitation website.";
  const url = `${appOrigin()}${PATH}`;
  const image = `${appOrigin()}/products/wedding/og.jpg`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "The Royal Burgundy wedding invitation on three phones: envelope, cover and schedule" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    // Not on sale yet (admin testing): keep it out of search engines.
    robots: p?.is_active ? undefined : { index: false, follow: false },
  };
}

const FEATURES: [title: string, body: string, at: string][] = [
  ["The envelope", "A burgundy envelope with embossed roses and a wax seal with your initials. One tap breaks the seal and golden light pours out.", "envelope"],
  ["Your cover", "Your names in flowing script under an ornate arch, two swans on a still lake and your wedding date.", "cover"],
  ["Your invitation", "Your words of welcome, and up to three photos of the two of you in arched frames.", "couple"],
  ["Live countdown", "Days, hours, minutes and seconds to your ceremony — right for guests in any time zone.", "countdown"],
  ["Schedule of events", "Arrival, ceremony, dinner, dancing… a timeline with roses, as many events as you need.", "schedule"],
  ["Venue & map", "Venue name, address and an embedded map, plus an “Open in Google Maps” button.", "location"],
  ["Dress code", "Your suggested colours, worn by illustrated guests.", "dresscode"],
  ["RSVP", "Guests tap a wax seal to reply: attending or not, how many, and a message. You see every reply.", "rsvp"],
  ["Save the date", "A closing page with your names, and one-tap Google, Apple or Outlook calendar buttons.", "closing"],
];

const GALLERY: [src: string, alt: string][] = [
  ["/products/wedding/envelope.webp", "The sealed burgundy envelope with a wax seal"],
  ["/products/wedding/cover.webp", "The cover: names under an ornate arch with two swans"],
  ["/products/wedding/schedule.webp", "The schedule of events timeline and venue"],
  ["/products/wedding/rsvp.webp", "The RSVP section with a burgundy wax seal"],
];

const FAQ = [
  { q: "Do our guests need an app or an account?", a: "No. They open your link straight from WhatsApp, Instagram or a text message, on any phone or computer." },
  { q: "How do RSVPs work?", a: "Guests tap the RSVP seal, enter their name, whether they're coming, how many of them, and an optional message. Replies appear only in your dashboard, with totals and a CSV download. Each guest name can reply once; you can remove a reply so they can answer again." },
  { q: "Can we change details after sending it?", a: "Yes. Edit any time during your editing window and press Publish again — the same link shows the update." },
  { q: "Will the music play by itself?", a: "Never on page load. You can let it start when a guest taps the seal (that tap counts as their permission), and there's always a pause button." },
  { q: "Is it private?", a: "Every invitation has a long random link, is hidden from search engines and can have a passcode. Link previews show a generic envelope — never your names or photos." },
  { q: "Can we use our own colours?", a: "Pick Royal Burgundy, Emerald & Gold, Midnight Navy or Blush Garden — or set every colour yourself. The artwork follows your palette." },
];

export default async function WeddingInvitationProductPage() {
  const p = await load();
  if (!p) notFound();
  const free = p.price_paise === 0;
  const price = free ? "Free" : formatINR(p.price_paise);
  const buy = `/checkout?product=${p.id}`;
  const live = p.live_days >= 365 ? `${Math.round(p.live_days / 365)} year${p.live_days >= 730 ? "s" : ""}` : `${p.live_days} days`;
  return (
    <main>
      {!p.is_active && (
        <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
          <Notice>
            <b>Testing mode — only admins can see this page.</b> This product isn&apos;t on sale yet. Put it on sale and set its price in{" "}
            <Link className="font-bold underline" href="/admin/catalog">
              Admin → Templates &amp; pricing
            </Link>
            .
          </Notice>
        </div>
      )}

      {/* hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_80%_0%,#7a2840_0%,#5b1727_45%,#351018_100%)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(220px_220px_at_88%_18%,rgba(232,201,138,.22),transparent),radial-gradient(260px_200px_at_8%_90%,rgba(183,110,121,.25),transparent)]" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-[#f5e6c8]/80">
              <Link href="/" className="underline-offset-2 hover:underline">
                Home
              </Link>{" "}
              › <span>Wedding Invitations</span>
            </nav>
            <h1 className="mt-3 font-display text-4xl leading-tight font-semibold sm:text-5xl">{p.name}</h1>
            <p className="mt-4 max-w-prose text-lg text-white/85">{p.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={buy} className="bg-[linear-gradient(180deg,#e0c286,#c9a25f)] text-[#351018] shadow-[0_0_24px_rgba(201,162,95,.45)] hover:brightness-105" data-testid="wedding-buy">
                Create your invitation · {price}
              </ButtonLink>
              <ButtonLink href="/demo/wedding" variant="secondary" target="_blank" data-testid="wedding-demo">
                Live demo
              </ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Highlights">
              {["Mobile-first", "Opens from WhatsApp", "Working RSVPs", "Your colours", "Private link"].map((t) => (
                <li key={t} className="rounded-full border border-white/25 bg-white/10 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#1e0a10] bg-[#1e0a10] shadow-[0_0_40px_rgba(201,162,95,.3),8px_8px_0_#b76e79]">
              <WeddingTeaser />
            </div>
            <p className="mt-3 text-center font-display text-lg italic text-[#f5e6c8]/85">a real one — try it ♡</p>
          </div>
        </div>
      </section>

      {/* gallery */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="look">
        <h2 id="look" className="font-display text-3xl font-semibold">Made to feel like a printed invitation</h2>
        <p className="mt-2 max-w-prose text-ink-soft">Burgundy, rose gold, champagne and blush — original illustrated roses, an ogee arch and swans, set in elegant script and serif type.</p>
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {GALLERY.map(([src, alt]) => (
            <li key={src} className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-white shadow-[5px_5px_0_var(--color-blush)]">
              <Image src={src} alt={alt} width={600} height={1298} sizes="(max-width: 768px) 45vw, 240px" className="h-auto w-full" />
            </li>
          ))}
        </ul>
      </section>

      {/* sections */}
      <section className="bg-white/70 py-14" aria-labelledby="inside">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="inside" className="font-display text-3xl font-semibold">Everything your guests need, in one link</h2>
          <p className="mt-2 max-w-prose text-ink-soft">Switch off anything you don&apos;t need. Tap any card to open that part of the live demo.</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, b, at], i) => (
              <li key={t}>
                <Link href={`/demo/wedding?at=${at}`} target="_blank" className="group block h-full rounded-2xl border-2 border-ink/80 bg-white p-5 shadow-[5px_5px_0_var(--color-blush)] transition hover:-translate-y-0.5">
                  <span className="font-pixel text-sm text-rose">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{b}</p>
                  <span className="mt-3 inline-block text-sm font-bold text-rose group-hover:underline">Preview →</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* palettes */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="custom">
        <h2 id="custom" className="font-display text-3xl font-semibold">Make it yours — no code</h2>
        <p className="mt-2 max-w-prose text-ink-soft">A visual studio with a live phone preview: names, date, schedule, venue, dress code, RSVP settings, music and colours. Everything saves as you type.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(THEME_PRESETS).map((t) => (
            <li key={t.label} className="overflow-hidden rounded-2xl border-2 border-ink/15 bg-white">
              <div className="flex h-16">
                {[t.palette.wine, t.palette.burgundy, t.palette.rose, t.palette.gold, t.palette.champagne, t.palette.blush].map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="px-4 py-3 font-bold">{t.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* how it works */}
      <section className="bg-white/70 py-14" aria-labelledby="how">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="how" className="font-display text-3xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Get it & sign in", free ? "Sign in with a link sent to your email — no payment needed." : `Pay securely with UPI, card or netbanking (Razorpay) — ${price} one time. Sign in with a link sent to your email.`],
              ["Personalise", "Add your names, date, venue, schedule and colours in the studio, and watch the phone preview update."],
              ["Send & collect RSVPs", "Publish, then share your private link on WhatsApp. Replies arrive in your dashboard."],
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
        </div>
      </section>

      {/* pricing */}
      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6" aria-labelledby="pricing">
        <h2 id="pricing" className="text-center font-display text-3xl font-semibold">
          Pricing
        </h2>
        <Card className="mt-6">
          <p className="font-display text-xl font-semibold">{p.name}</p>
          <p className="mt-1 font-pixel text-4xl text-rose" data-testid="wedding-price">
            {price}
          </p>
          <p className="text-sm text-ink-soft">{free ? "no payment needed" : "one-time payment · GST as applicable"}</p>
          <ul className="mt-5 space-y-2">
            <li>✓ Every section, fully customisable — switch any off</li>
            <li>✓ RSVPs with totals, guest messages and CSV download</li>
            <li>✓ Your own private link (and QR code), optional passcode</li>
            <li>
              ✓ Edit for {p.edit_days} days, live for {live}
            </li>
            <li>✓ Up to 3 couple photos, a venue photo and your song</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={buy}>Create your invitation</ButtonLink>
            <ButtonLink href="/demo/wedding" variant="secondary" target="_blank">
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
          <ButtonLink href={buy}>Start your invitation ♡</ButtonLink>
        </div>
      </section>
    </main>
  );
}
