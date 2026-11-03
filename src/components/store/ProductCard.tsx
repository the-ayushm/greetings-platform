import Link from "next/link";
import { categoryById, discountPercent, priceLabel, type StoreProduct } from "@/lib/store";
import { ProductThumb } from "./ProductArt";

/** Price with the original price and discount only when the product genuinely has one. */
export function Price({ p, size = "md" }: { p: StoreProduct; size?: "md" | "lg" }) {
  const off = discountPercent(p);
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-extrabold text-wine ${size === "lg" ? "text-3xl" : "text-xl"}`} data-testid="product-price">
        {priceLabel(p.pricePaise)}
      </span>
      {p.compareAtPaise && (
        <>
          <s className="text-sm text-ink-soft" aria-label={`Original price ${priceLabel(p.compareAtPaise)}`}>
            {priceLabel(p.compareAtPaise)}
          </s>
          <span className="rounded-full bg-[#e7f6ee] px-2 py-0.5 text-xs font-extrabold text-[#17724f]">{off}% off</span>
        </>
      )}
    </p>
  );
}

export function ProductCard({ p, headingLevel = 3 }: { p: StoreProduct; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const category = categoryById(p.meta.categories[0]!);
  return (
    <article className="soft-card soft-card-hover group relative flex h-full flex-col overflow-hidden" data-testid="product-card" data-product={p.templateKey}>
      <div>
        <ProductThumb art={p.meta.art} tint={p.meta.tint} className="aspect-[4/3]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-baby px-2.5 py-1 text-rose">{category.title}</span>
          {p.featured && <span className="rounded-full bg-[#fff1d6] px-2.5 py-1 text-[#8a5a12]">★ Trending</span>}
          {p.isNew && <span className="rounded-full bg-[#e9f3ff] px-2.5 py-1 text-[#1f5b9e]">New</span>}
        </div>
        <H className="mt-3 font-display text-xl leading-snug font-semibold text-wine">
          <Link href={p.meta.href} className="after:absolute after:inset-0 focus:outline-none [&:focus-visible]:underline">
            {p.name}
          </Link>
        </H>
        <p className="mt-1 text-sm text-ink-soft">{p.meta.tagline}</p>
        <div className="mt-auto pt-4">
          <Price p={p} />
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
            <Link href={p.meta.demo} target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/20 px-3 text-sm font-bold text-ink transition hover:border-ink/50 hover:bg-baby" aria-label={`Live demo of ${p.name} (opens in a new tab)`}>
              Live demo
            </Link>
            <Link href={`/checkout?product=${p.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose px-3 text-sm font-bold text-white transition hover:bg-rose-dark" aria-label={`Create ${p.name}`}>
              Create yours
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
