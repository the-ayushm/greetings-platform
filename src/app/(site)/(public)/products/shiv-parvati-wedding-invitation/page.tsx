import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedProducts } from "@/components/store/RelatedProducts";
import { VivahTeaser } from "@/components/VivahTeaser";
import { ButtonLink, Card, Notice, formatINR } from "@/components/ui";
import { canSeeUnlisted, currentUser } from "@/server/auth";
import { storeProduct } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

const PATH = "/products/shiv-parvati-wedding-invitation";
const DEMO = "/demo/shiv-parvati";

/** Customers see the product once it's on sale; until then only MFA'd admins can open this page. */
async function load() {
  return storeProduct("vivah", await canSeeUnlisted(await currentUser()));
}

export async function generateMetadata(): Promise<Metadata> {
  const p = await load();
  const title = p?.name ?? "Shiv–Parvati Wedding Invitation";
  const description = p?.description ?? "A divine, interactive Hindu wedding invitation your guests open on WhatsApp.";
  const url = `${appOrigin()}${PATH}`;
  const image = `${appOrigin()}/og/vivah.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1200, height: 630, alt: "Shiv's hand holding jasmine and roses as Parvati steps down from the sky" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: p?.is_active ? undefined : { index: false, follow: false },
  };
}

const FEATURES: [title: string, body: string, at: string][] = [
  ["Divine opening", "Shiv's hand rises with jasmine and roses as Parvati steps down from the sky — “Written by destiny, blessed by Mahadev” and your names. One tap opens it and your song begins.", ""],
  ["Kailash & Ganesh vandana", "A cinematic Kailash scene with falling petals, the Vakratunda mantra and your names, zooming gently as guests scroll.", ""],
  ["Your families", "Om, the families inviting, your message, both full names and parents' names.", "families"],
  ["Scratch to reveal", "Guests scratch a gold-foil card to reveal your wedding date — with a burst of marigolds and jasmine.", "scratch"],
  ["Live countdown", "Days, hours, minutes and seconds to your muhurat.", "countdown"],
  ["Every function", "Haldi, Mehendi, Sangeet, Phere, Reception… each on its own card with venue, dress code, Directions and Save-date.", "events"],
  ["Your photos", "Pre-wedding photos as tilted polaroids, with a swipeable full-screen viewer.", "gallery"],
  ["RSVP on WhatsApp", "Guests pick the functions and number of guests; one tap sends you a ready-written WhatsApp message.", "rsvp"],
  ["Closing blessing", "Your names, hashtag and a closing blessing under the Shiv–Parvati arch.", "closing"],
];

const LOOK: [src: string, alt: string, w: number, h: number][] = [
  ["/vivah-assets/illus/shiv-kailash.jpg", "Shiv and Parvati seated together on Kailash", 864, 1536],
  ["/vivah-assets/illus/shiv-card.webp", "The jasmine-arch function card", 774, 1442],
  ["/vivah-assets/moments/m2.jpg", "A sample couple photo as a polaroid", 1200, 1500],
];

const FAQ = [
  { q: "Can I put our own names, families and functions?", a: "Yes — everything. Bride and groom names, parents' names, the families inviting, your message, the wedding date and muhurat, city, hashtag, and as many functions as you need (up to 8) with their own date, time, venue, address, note and dress code." },
  { q: "How do RSVPs work?", a: "Guests tap Accept or Decline, enter their name and number of guests, tick the functions they'll attend and add a note. Pressing “Send RSVP on WhatsApp” opens WhatsApp with a ready-written message to the number you set — so replies come straight to your phone." },
  { q: "Can we use our own song and photos?", a: "Yes. The default song is “Piya Ghar Aavenge”; you can upload your own (MP3/M4A, up to 8 minutes) or switch music off. Add up to 10 photos — iPhone HEIC photos work too." },
  { q: "Do guests need an app?", a: "No. They open your link straight from WhatsApp, Instagram or SMS, on any phone or computer." },
  { q: "Can we change details after sending it?", a: "Yes. Edit any time during your editing window and press Publish again — the same link shows the update." },
  { q: "Is it private?", a: "Every invitation has a long random link, is hidden from search engines and can have a passcode. Link previews show a generic card — never your names or photos." },
];

export default async function VivahProductPage() {
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
      <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_80%_0%,#fde8ec_0%,#f6d9df_45%,#efc6cf_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(260px_220px_at_88%_18%,rgba(255,255,255,.7),transparent),radial-gradient(260px_200px_at_8%_90%,rgba(184,134,47,.18),transparent)]" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-wine/70">
              <Link href="/" className="underline-offset-2 hover:underline">
                Home
              </Link>{" "}
              ›{" "}
              <Link href="/categories/wedding-invitations" className="underline-offset-2 hover:underline">
                Wedding Invitations
              </Link>
            </nav>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-extrabold tracking-[0.14em] text-[#9a1d45] uppercase">🔱 New · Har Har Mahadev</p>
            <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-[#36101c] sm:text-5xl">{p.name}</h1>
            <p className="mt-4 max-w-prose text-lg text-[#55303b]">{p.description}</p>
            <p className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-[#9a1d45]" data-testid="vivah-price">
                {price}
              </span>
              <span className="text-sm text-[#55303b]">one time · no app for guests</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={buy} className="bg-[#9a1d45] text-white shadow-[0_14px_28px_-14px_rgba(154,29,69,.9)] hover:bg-[#741225]" data-testid="vivah-buy">
                Create your invitation · {price}
              </ButtonLink>
              <ButtonLink href={DEMO} variant="secondary" target="_blank" data-testid="vivah-demo">
                Live demo
              </ButtonLink>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2 text-sm text-[#55303b]" aria-label="Highlights">
              {["Opens from WhatsApp", "Your names & families", "All functions", "Your photos & song", "RSVP on WhatsApp"].map((t) => (
                <li key={t} className="rounded-full border border-[#b8862f]/40 bg-white/70 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#2a1219] bg-[#2a1219] shadow-[0_30px_60px_-28px_rgba(42,18,25,.7),8px_8px_0_#e8b4c0]">
              <VivahTeaser priority />
            </div>
            <p className="mt-3 text-center font-display text-lg text-[#741225] italic">a real one — tap to try it ♡</p>
          </div>
        </div>
      </section>

      {/* look */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="look">
        <h2 id="look" className="font-display text-3xl font-semibold">Made for a sacred beginning</h2>
        <p className="mt-2 max-w-prose text-ink-soft">Soft pink skies, Kailash, jasmine arches and gold — set in elegant script, Cinzel and Devanagari type, with gentle motion everywhere.</p>
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
          {LOOK.map(([src, alt, w, h]) => (
            <li key={src} className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-white shadow-[5px_5px_0_var(--color-blush)]">
              <Image src={src} alt={alt} width={w} height={h} sizes="(max-width: 768px) 30vw, 300px" unoptimized className="aspect-[9/16] h-auto w-full object-cover" />
            </li>
          ))}
        </ul>
      </section>

      {/* sections */}
      <section className="bg-white/70 py-14" aria-labelledby="inside">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="inside" className="font-display text-3xl font-semibold">Everything your guests need, in one link</h2>
          <p className="mt-2 max-w-prose text-ink-soft">Switch off anything you don&apos;t need. Tap a card to open that part of the live demo.</p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([t, b, at], i) => (
              <li key={t}>
                <Link href={at ? `${DEMO}?at=${at}` : DEMO} target="_blank" className="group block h-full rounded-2xl border-2 border-ink/80 bg-white p-5 shadow-[5px_5px_0_var(--color-blush)] transition hover:-translate-y-0.5">
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

      {/* how it works */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl font-semibold">Ready in 10 minutes</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Get it & sign in", free ? "Sign in with a link sent to your email — no payment needed." : `Pay ${price} securely with UPI, card or netbanking (Razorpay). Sign in with a link sent to your email.`],
            ["Fill in your details", "Names, families, date, functions, photos, song and your WhatsApp number — with a live phone preview that updates as you type."],
            ["Share on WhatsApp", "Publish and send your private link (or QR code) to every guest. RSVPs arrive on your WhatsApp."],
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
      <section className="bg-white/70 py-14" aria-labelledby="pricing">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <h2 id="pricing" className="text-center font-display text-3xl font-semibold">
            Pricing
          </h2>
          <Card className="mt-6">
            <p className="font-display text-xl font-semibold">{p.name}</p>
            <p className="mt-1 font-pixel text-4xl text-rose">{price}</p>
            <p className="text-sm text-ink-soft">{free ? "no payment needed" : "one-time payment · GST as applicable"}</p>
            <ul className="mt-5 space-y-2">
              <li>✓ Your names, families, date and every function</li>
              <li>✓ Up to 10 photos and your own song (or ours)</li>
              <li>✓ RSVPs straight to your WhatsApp</li>
              <li>✓ Your own private link (and QR code), optional passcode</li>
              <li>
                ✓ Edit for {p.edit_days} days, live for {live}
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={buy}>Create your invitation</ButtonLink>
              <ButtonLink href={DEMO} variant="secondary" target="_blank">
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
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6" aria-labelledby="faq">
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
          <ButtonLink href={buy}>Start your invitation · {price} 🔱</ButtonLink>
        </div>
      </section>
      <RelatedProducts current="vivah" />
    </main>
  );
}
