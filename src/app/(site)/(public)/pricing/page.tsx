import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "@/components/store/ProductArt";
import { Price } from "@/components/store/ProductCard";
import { SectionHeading } from "@/components/store/SectionHeading";
import { categoryById, filterProducts } from "@/lib/store";
import { listStoreProducts } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

const DESCRIPTION = "Simple one-time prices for every Digital Gifting experience. No subscriptions — personalise it, publish it, share it.";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Pricing", description: DESCRIPTION, alternates: { canonical: `${appOrigin()}/pricing` } };
}

const span = (days: number) => (days >= 365 ? `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}` : `${days} days`);

export default async function PricingPage() {
  const products = filterProducts(await listStoreProducts(), { sort: "price-asc" });
  return (
    <main className="store-glow">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-4 sm:px-6 sm:pt-14">
        <SectionHeading as="h1" eyebrow="Pricing" title="One gift, one simple price" intro="Pay once — no subscriptions, no hidden fees. Every gift includes its studio, a private link with QR code, an optional passcode and a live demo you can try first." />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {products.length === 0 ? (
          <p className="rounded-2xl bg-baby px-5 py-6 text-ink-soft">New gifts are on their way — check back soon ♡</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {products.map((p) => (
              <li key={p.id} className="soft-card flex gap-5 p-5 sm:p-6" data-testid="pricing-row" data-product={p.templateKey}>
                <div className={`relative hidden w-28 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br sm:block ${p.meta.tint}`}>
                  <Phone art={p.meta.art} className="absolute top-3 left-1/2 w-[70%] -translate-x-1/2 text-[8px]" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-xs font-bold text-rose">{categoryById(p.meta.categories[0]!).title}</p>
                  <h2 className="mt-1 font-display text-xl leading-snug font-semibold text-wine">{p.name}</h2>
                  <div className="mt-2">
                    <Price p={p} size="lg" />
                  </div>
                  <p className="text-xs text-ink-soft">{p.pricePaise === 0 ? "No payment needed" : "One-time payment · GST as applicable"}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-ink">
                    <li>✓ Edit for {p.editDays} days · live for {span(p.liveDays)}</li>
                    {p.meta.highlights.slice(0, 3).map((h) => (
                      <li key={h}>✓ {h}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/checkout?product=${p.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-rose px-5 text-sm font-bold text-white hover:bg-rose-dark">
                      Create yours
                    </Link>
                    <Link href={p.meta.href} className="inline-flex min-h-11 items-center rounded-xl border border-wine/20 bg-white px-5 text-sm font-bold text-wine hover:border-wine/50">
                      Details
                    </Link>
                    <Link href={p.meta.demo} target="_blank" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-rose underline">
                      Live demo ↗
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="soft-card mt-8 grid gap-4 p-6 text-sm text-ink-soft sm:grid-cols-3">
          <p>
            <b className="block text-wine">Secure payment</b>UPI, cards, netbanking and wallets through Razorpay.
          </p>
          <p>
            <b className="block text-wine">Instant delivery</b>Your gift is ready to personalise the moment payment is confirmed.
          </p>
          <p>
            <b className="block text-wine">Fair refunds</b>
            See our{" "}
            <Link href="/legal/refund" className="font-bold text-rose underline">
              refund policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
