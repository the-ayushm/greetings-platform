import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryRedirect } from "@/components/RecoveryRedirect";
import { DemoShowcase, type DemoItem } from "@/components/store/DemoShowcase";
import { Phone } from "@/components/store/ProductArt";
import { ProductCard } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { StoreSearch } from "@/components/store/StoreSearch";
import { Testimonials } from "@/components/store/Testimonials";
import { CATEGORIES, filterProducts, REVIEWS } from "@/lib/store";
import { listStoreProducts } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

const TITLE = "Digital Gifting — personalised interactive websites & digital gifts";
const DESCRIPTION = "Discover interactive birthday surprises, love story websites, romantic questions and wedding invitations — personalised by you and shared as one private link.";

export async function generateMetadata(): Promise<Metadata> {
  const url = appOrigin();
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: `${url}/` },
    openGraph: { title: TITLE, description: DESCRIPTION, url, type: "website", siteName: "Digital Gifting", images: [{ url: `${url}/og/digital-gifting.png`, width: 1200, height: 630, alt: "Digital Gifting — interactive digital gifts on phones" }] },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${url}/og/digital-gifting.png`] },
  };
}

const WHY: [title: string, body: string, icon: string][] = [
  ["Unique & personal", "Your names, words, photos and music — every gift is made for exactly one person.", "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"],
  ["Instant digital delivery", "Your gift is ready to personalise the moment you buy — no waiting, no shipping.", "M13 2 4 14h7l-1 8 9-12h-7z"],
  ["Works on every device", "Phones, tablets and laptops — designed phone-first for WhatsApp and Instagram.", "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm4 17h2"],
  ["No app to install", "They just tap your link. No downloads, no sign-up, nothing in the way.", "M4 12h16M12 4v16"],
  ["Easy to customise", "A friendly studio with a live preview. Change anything, any time in your editing window.", "M4 20h4L19 9l-4-4L4 16zM14 6l4 4"],
  ["Private, shareable links", "A long secret link (and QR code), hidden from search engines, with an optional passcode.", "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
];

const STEPS: [title: string, body: string][] = [
  ["Explore your gift", "Browse our collection and try any experience live before you buy."],
  ["Personalise it", "Add names, photos, messages, music and more in the studio — with a live preview."],
  ["Share the magic", "Publish, then send your private link on WhatsApp, Instagram or as a QR code."],
];

const FAQ = [
  { q: "What is Digital Gifting?", a: "We make personalised, interactive websites that work as gifts — birthday surprises, love stories, romantic questions, wedding invitations and more. You personalise one, and send it to someone as a private link." },
  { q: "How does a digital gift website work?", a: "Choose a gift, make it yours in our studio (names, words, photos, music…), then publish. You get a private link that opens the experience on any phone or computer." },
  { q: "Can I customise my gift?", a: "Yes — that's the whole idea. Every gift has its own studio with a live preview. What you can change depends on the gift and is listed on its page." },
  { q: "Does the recipient need to install an app?", a: "No. They open your link straight from WhatsApp, Instagram, a text message or email. Nothing to download, no account needed." },
  { q: "Can I preview a product before purchasing?", a: "Absolutely. Every product has a live demo — the real interactive experience, not a screenshot. Try it as many times as you like." },
  { q: "How do I receive my website after payment?", a: "Instantly. As soon as your payment is confirmed, your gift appears in My Sites and you go straight to its studio to personalise it." },
  { q: "Can I edit my website later?", a: "Yes, during your editing window (shown on each product's page). Edit, press Publish again, and the same link shows the update." },
  { q: "How long does my website remain active?", a: "Each gift stays live for the period shown on its product page (for example, one year). You can unpublish or delete it any time before that." },
];

export default async function Home() {
  const products = await listStoreProducts();
  const collection = filterProducts(products, { sort: "featured" });
  const trending = collection.filter((p) => p.featured);
  const categories = CATEGORIES.map((c) => ({ c, items: products.filter((p) => p.meta.categories.includes(c.id)) })).filter((x) => x.items.length > 0);
  const demos: DemoItem[] = collection.map((p) => ({ key: p.templateKey, label: p.meta.label, name: p.name, tagline: p.meta.tagline, highlights: p.meta.highlights, demo: p.meta.demo, href: p.meta.href, art: p.meta.art }));
  // Hero collage: what's actually on sale (at most three phones).
  const heroArt = collection.slice(0, 3).map((p) => p.meta.art);

  return (
    <main>
      <RecoveryRedirect />

      {/* A — hero */}
      <section className="store-glow relative overflow-hidden" aria-labelledby="hero">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-[1.05fr_.95fr] md:pt-20 md:pb-24">
          <div>
            <p className="eyebrow">Digital Gifting ♡</p>
            <h1 id="hero" className="mt-4 font-display text-[2.6rem] leading-[1.05] font-semibold text-wine sm:text-6xl">
              Make every moment <span className="text-rose italic">unforgettable</span> ♡
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Discover beautiful interactive websites, personalised digital gifts, romantic surprises and invitations — thoughtfully created for the people who matter most.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex min-h-12 items-center rounded-2xl bg-rose px-6 text-base font-bold text-white shadow-[0_14px_28px_-14px_rgba(193,58,82,.9)] transition hover:bg-rose-dark">
                Explore all gifts
              </Link>
              <Link href="#how-it-works" className="inline-flex min-h-12 items-center rounded-2xl border border-wine/20 bg-white/70 px-6 text-base font-bold text-wine transition hover:border-wine/50">
                See how it works
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-soft" aria-label="Why people choose us">
              <li>✓ Try every gift live</li>
              <li>✓ No app for them</li>
              <li>✓ Private link</li>
            </ul>
          </div>
          {heroArt.length > 0 && (
            <div className="relative mx-auto h-[340px] w-full max-w-[460px] sm:h-[420px]" aria-hidden="true">
              <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(245,154,184,.45),transparent)]" />
              {heroArt.map((art, i) => {
                const pos = [
                  "left-[2%] top-[14%] -rotate-[10deg] w-[34%]",
                  "left-[33%] top-[0%] w-[36%] z-10",
                  "right-[2%] top-[12%] rotate-[9deg] w-[34%]",
                ][i];
                return <Phone key={art} art={art} priority={i < 2} className={`absolute ${pos} text-[11px] sm:text-[13px]`} />;
              })}
            </div>
          )}
        </div>
      </section>

      {/* B — categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="categories">
          <SectionHeading id="categories" eyebrow="Shop by category" title="Find the perfect digital gift" />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {categories.map(({ c, items }) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="soft-card soft-card-hover group flex h-full flex-col overflow-hidden" data-testid="category-card">
                  <div className={`relative h-28 overflow-hidden bg-gradient-to-br sm:h-36 ${c.tint}`}>
                    <Phone art={items[0]!.meta.art} className="absolute top-4 left-1/2 w-[26%] -translate-x-1/2 text-[9px] transition duration-500 group-hover:-translate-y-1 sm:w-[22%]" />
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="font-display text-lg leading-tight font-semibold text-wine sm:text-xl">{c.title}</h3>
                    <p className="mt-1 hidden text-sm text-ink-soft sm:block">{c.short}</p>
                    <span className="mt-auto pt-3 text-sm font-bold text-rose">
                      Explore {items.length > 1 ? `${items.length} gifts` : "gift"} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* C — collection */}
      <section className="bg-white/60 py-16" aria-labelledby="collection">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="collection" eyebrow="The collection" title="Explore our collection" />
            <StoreSearch />
          </div>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter by category">
            <Link href="/products" className="rounded-full bg-wine px-4 py-2 text-sm font-bold text-white">
              All
            </Link>
            {categories.map(({ c }) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-full border border-wine/15 bg-white px-4 py-2 text-sm font-bold text-wine transition hover:border-wine/40">
                {c.title}
              </Link>
            ))}
          </div>
          {collection.length > 0 ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {collection.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <ProductCard p={p} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-2xl bg-baby px-5 py-6 text-ink-soft">New gifts are on their way — check back soon ♡</p>
          )}
          <div className="mt-8 text-center">
            <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl border border-wine/20 bg-white px-6 font-bold text-wine transition hover:border-wine/50">
              View all products →
            </Link>
          </div>
        </div>
      </section>

      {/* D — trending (only products an admin marked as trending) */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="trending">
          <SectionHeading id="trending" eyebrow="Loved right now" title="Trending experiences ♡" />
          <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {trending.map((p) => (
              <li key={p.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
                <ProductCard p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* E — live demos */}
      {demos.length > 0 && (
        <section className="store-glow py-16" aria-labelledby="demos">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading id="demos" eyebrow="Live previews" title="Don't just imagine it. Experience it." intro="Every gift has a working demo — the real interactive experience your person will open. Try it before you buy." />
            <DemoShowcase items={demos} />
          </div>
        </section>
      )}

      {/* F — why */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="why">
        <SectionHeading id="why" eyebrow="Why Digital Gifting" title="Gifts that feel personal — and arrive instantly" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(([t, b, d]) => (
            <li key={t} className="soft-card p-6">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-baby text-rose">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={d} />
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-wine">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* G — how it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-[linear-gradient(160deg,#4a1d2c,#6a2a3e)] py-16 text-white" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="eyebrow !text-champagne">How it works</p>
          <h2 id="how" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Three steps to a gift they&apos;ll never forget
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur">
                <span className="font-display text-4xl text-champagne italic" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="mt-2 text-xl font-extrabold">{t}</h3>
                <p className="mt-1 text-white/80">{b}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link href="/products" className="inline-flex min-h-12 items-center rounded-2xl bg-white px-6 font-bold text-wine transition hover:bg-champagne">
              Start exploring →
            </Link>
          </div>
        </div>
      </section>

      {/* H — reviews (genuine only; hidden while there are none) */}
      <Testimonials reviews={REVIEWS} />

      {/* I — FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="faq">
        <SectionHeading id="faq" eyebrow="Questions" title="Good to know" />
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="soft-card group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-wine">
                {f.q}
                <span aria-hidden="true" className="text-rose transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
