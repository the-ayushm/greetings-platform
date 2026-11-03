import Link from "next/link";
import { PRODUCT_META } from "@/lib/store";
import { listStoreProducts } from "@/server/catalog";
import { ProductCard } from "./ProductCard";

/** "You may also love": other products on sale, those sharing a category first (max three). */
export async function RelatedProducts({ current }: { current: string }) {
  const mine = new Set(PRODUCT_META[current]?.categories ?? []);
  const others = (await listStoreProducts())
    .filter((p) => p.templateKey !== current)
    .map((p) => ({ p, shared: p.meta.categories.filter((c) => mine.has(c)).length }))
    .sort((a, b) => b.shared - a.shared || Number(b.p.featured) - Number(a.p.featured))
    .slice(0, 3)
    .map((x) => x.p);
  if (others.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6" aria-labelledby="related">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">More from Digital Gifting</p>
          <h2 id="related" className="mt-2 font-display text-3xl font-semibold text-wine">
            You may also love
          </h2>
        </div>
        <Link href="/products" className="text-sm font-bold text-rose underline">
          Explore all gifts →
        </Link>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((p) => (
          <li key={p.id}>
            <ProductCard p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
