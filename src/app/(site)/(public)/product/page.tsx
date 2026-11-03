import type { Metadata } from "next";
import Link from "next/link";
import { DemoTeaser } from "@/components/DemoTeaser";
import { RelatedProducts } from "@/components/store/RelatedProducts";
import { ButtonLink, Card, Notice, formatINR } from "@/components/ui";
import { activeProduct } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const p = await activeProduct();
  const title = "Birthday Surprise — a private, interactive birthday website";
  const description = p?.description || "A scrapbook-style birthday website with your letter, photos, coupons and song — sent as one private link.";
  const url = `${appOrigin()}/product`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", images: [{ url: `${appOrigin()}/demo-poster.webp`, width: 390, height: 844 }] } };
}

const FEATURES = [
  { title: "A letter in an envelope", body: "They tap the wax seal, the flap opens and your letter unfolds line by line." },
  { title: "Polaroid memories", body: "Up to 12 photos pinned, taped and clipped to a scrapbook page. Tap one to hold it closer." },
  { title: "Love coupons", body: "Little tickets they can flip over and “use” — a movie night, a hug, a day of their choice." },
  { title: "Your song", body: "Upload the song that's yours, or let our original music-box tune play." },
  { title: "A cupcake wish", body: "One tap blows out the candle, with confetti, before the last surprise." },
  { title: "One more thing…", body: "A final page with your message, your photo, and the lines you save for last." },
];

const FAQ = [
  { q: "Does the birthday person need an app or an account?", a: "No. They open the link on any phone or computer and it just works." },
  { q: "Can I change things after I've shared it?", a: "Yes — during your editing window. Press Publish again and the same link shows the new version." },
  { q: "Can someone find it on Google?", a: "No. Every site has a long random link, is hidden from search engines, and can have a passcode." },
  { q: "Can I use any song?", a: "Please only upload a song you have the right to share privately. If you'd rather not, the built-in music box plays instead." },
];

export default async function ProductPage() {
  const p = await activeProduct();
  return (
    <main>
      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#ffd7e2_0%,#ffe9ef_50%,#fff6f8_100%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              ›{" "}
              <Link href="/categories/birthday-surprises" className="hover:underline">
                Birthday Surprises
              </Link>
            </nav>
            <p className="mt-3 font-hand text-2xl text-rose">a birthday surprise they can open ♡</p>
            <h1 className="font-display text-4xl leading-tight font-semibold text-wine sm:text-5xl">{p?.name ?? "Scrapbook Surprise"}</h1>
            <p className="mt-4 max-w-prose text-lg text-ink-soft">One personal birthday website, made by you, for one special person — your letter, photos, little coupons and your song, sent as one secret link.</p>
            {p && (
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href={`/checkout?product=${p.id}`}>Make yours</ButtonLink>
                <ButtonLink href="/demo" variant="secondary" target="_blank">
                  Try the live demo
                </ButtonLink>
              </div>
            )}
          </div>
          <div className="mx-auto w-full max-w-[280px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-ink bg-ink shadow-[0_30px_60px_-30px_rgba(91,35,51,.6)]">
              <DemoTeaser />
            </div>
            <p className="mt-3 text-center font-hand text-xl text-ink-soft">a real one, try it ♡</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="inside">
        <h2 id="inside" className="font-display text-3xl font-semibold text-wine">
          What&apos;s inside
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="soft-card p-6">
              <h3 className="font-pixel text-lg text-rose">{f.title}</h3>
              <p className="mt-2 text-ink-soft">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-xl px-4 pb-6 sm:px-6" aria-labelledby="pricing">
        <h2 id="pricing" className="text-center font-display text-3xl font-semibold text-wine">
          Pricing
        </h2>
        {!p ? (
          <div className="mt-6">
            <Notice tone="error">Sales are paused for a moment. Please check back soon.</Notice>
          </div>
        ) : (
          <Card className="mt-6">
            <p className="font-display text-xl font-semibold">{p.name}</p>
            <p className="font-pixel text-4xl text-rose">{formatINR(p.price_paise)}</p>
            <p className="text-sm text-ink-soft">one-time payment · GST as applicable</p>
            <ul className="mt-5 space-y-2">
              <li>✓ Your own private link (and QR code)</li>
              <li>✓ Letter, up to 12 photos, coupons, reasons list</li>
              <li>✓ Upload your song (MP3/M4A/AAC, up to 8 minutes) or use our music box</li>
              <li>
                ✓ Edit for {p.edit_days} days, live for {Math.round(p.live_days / 30)} months
              </li>
              <li>✓ Optional passcode, change the link any time</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/checkout?product=${p.id}`}>Buy now</ButtonLink>
              <ButtonLink href="/demo" variant="secondary">
                See the demo first
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Payments are processed by Razorpay. By buying you agree to our{" "}
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

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-3xl font-semibold text-wine">
          Questions
        </h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="soft-card px-5 py-4">
              <summary className="cursor-pointer font-bold text-wine">{f.q}</summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <RelatedProducts current="scrapbook" />
    </main>
  );
}
