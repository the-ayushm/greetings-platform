import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProductBrowser } from "@/components/store/ProductBrowser";
import { SectionHeading } from "@/components/store/SectionHeading";
import { categoryBySlug, isSort } from "@/lib/store";
import { listStoreProducts } from "@/server/catalog";
import { appOrigin } from "@/server/env";

export const dynamic = "force-dynamic";

const TITLE = "Explore digital gifts";
const DESCRIPTION = "Browse every Digital Gifting experience — interactive birthday surprises, love stories, romantic questions and wedding invitations. Try each one live.";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  const url = `${appOrigin()}/products`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: { title: `${TITLE} · Digital Gifting`, description: DESCRIPTION, url, type: "website", images: [{ url: `${appOrigin()}/og/digital-gifting.png`, width: 1200, height: 630 }] },
    // Search result pages aren't useful in search engines.
    robots: q ? { index: false, follow: true } : undefined,
  };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const sort = isSort(sp.sort) ? sp.sort : "featured";
  // ?category=… has a proper page of its own.
  if (typeof sp.category === "string" && categoryBySlug(sp.category)) {
    const rest = new URLSearchParams({ ...(q ? { q } : {}), ...(sort !== "featured" ? { sort } : {}) }).toString();
    redirect(`/categories/${sp.category}${rest ? `?${rest}` : ""}`);
  }
  const products = await listStoreProducts();
  return (
    <main className="store-glow">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14">
        <SectionHeading as="h1" eyebrow="Explore" title="All digital gifts" intro="Every experience in our collection. Each one has a live demo — try it before you make it yours." />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <ProductBrowser products={products} q={q} category={null} sort={sort} basePath="/products" />
      </div>
    </main>
  );
}
