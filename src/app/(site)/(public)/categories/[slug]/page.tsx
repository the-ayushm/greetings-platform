import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBrowser } from "@/components/store/ProductBrowser";
import { CATEGORIES, categoryBySlug, isSort } from "@/lib/store";
import { listStoreProducts } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const c = categoryBySlug((await params).slug);
  if (!c) return { title: "Not found" };
  const { q } = await searchParams;
  const url = `${appOrigin()}/categories/${c.slug}`;
  return {
    title: `${c.title} — digital gifts`,
    description: c.description,
    alternates: { canonical: url },
    openGraph: { title: `${c.title} · Digital Gifting`, description: c.description, url, type: "website", images: [{ url: `${appOrigin()}/og/digital-gifting.png`, width: 1200, height: 630 }] },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; sort?: string }> }) {
  const c = categoryBySlug((await params).slug);
  if (!c) notFound();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const sort = isSort(sp.sort) ? sp.sort : "featured";
  const products = await listStoreProducts();
  const others = CATEGORIES.filter((o) => o.id !== c.id && products.some((p) => p.meta.categories.includes(o.id)));
  return (
    <main>
      <section className={`bg-gradient-to-br ${c.tint}`}>
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
            <Link href="/" className="hover:underline">
              Home
            </Link>{" "}
            ›{" "}
            <Link href="/products" className="hover:underline">
              Explore
            </Link>{" "}
            › <span aria-current="page">{c.title}</span>
          </nav>
          <p className="eyebrow mt-4">Category</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-wine sm:text-5xl">{c.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">{c.description}</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ProductBrowser products={products} q={q} category={c} sort={sort} basePath={`/categories/${c.slug}`} />
      </div>
      {others.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6" aria-labelledby="more-cats">
          <h2 id="more-cats" className="font-display text-2xl font-semibold text-wine">
            More to explore
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`/categories/${o.slug}`} className={`soft-card soft-card-hover block bg-gradient-to-br p-4 ${o.tint}`}>
                  <span className="font-bold text-wine">{o.title}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{o.short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
