import Link from "next/link";
import { CATEGORIES, filterProducts, type Category, type SortId, type StoreProduct } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { SortSelect } from "./SortSelect";

/**
 * Search + category chips + sort + grid, shared by Explore (/products) and category pages.
 * Plain GET parameters (?q=&category=&sort=): shareable, and it works before JavaScript loads.
 */
export function ProductBrowser({ products, q, category, sort, basePath }: { products: StoreProduct[]; q: string; category: Category | null; sort: SortId; basePath: string }) {
  const results = filterProducts(products, { q, category: category?.id ?? null, sort });
  const available = CATEGORIES.filter((c) => products.some((p) => p.meta.categories.includes(c.id)));
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(sort !== "featured" ? { sort } : {}), ...extra });
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  const onCategoryPage = basePath.startsWith("/categories/");
  return (
    <div>
      <form action={basePath} method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!onCategoryPage && category && <input type="hidden" name="category" value={category.slug} />}
        <div role="search" className="relative w-full sm:max-w-sm">
          <label htmlFor="browse-q" className="sr-only">
            Search gifts
          </label>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input id="browse-q" type="search" name="q" defaultValue={q} maxLength={80} placeholder="Search by name or occasion" className="block min-h-12 w-full rounded-2xl border border-wine/15 bg-white pr-4 pl-10 focus:border-rose" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <SortSelect value={sort} />
          <button type="submit" className="min-h-11 rounded-xl bg-wine px-4 text-sm font-bold text-white hover:bg-rose">
            Apply
          </button>
        </div>
      </form>

      <nav aria-label="Categories" className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={`/products${qs({})}`} aria-current={!category ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${!category ? "bg-wine text-white" : "border border-wine/15 bg-white text-wine hover:border-wine/40"}`}>
          All gifts
        </Link>
        {available.map((c) => {
          const on = category?.id === c.id;
          return (
            <Link key={c.id} href={`/categories/${c.slug}${qs({})}`} aria-current={on ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${on ? "bg-wine text-white" : "border border-wine/15 bg-white text-wine hover:border-wine/40"}`}>
              {c.title}
            </Link>
          );
        })}
      </nav>

      <p className="mt-6 text-sm text-ink-soft" role="status" data-testid="result-count">
        {results.length} {results.length === 1 ? "gift" : "gifts"}
        {q && (
          <>
            {" "}
            for “<b className="text-wine">{q}</b>” ·{" "}
            <Link href={`${basePath}${sort !== "featured" ? `?sort=${sort}` : ""}`} className="font-bold text-rose underline">
              clear search
            </Link>
          </>
        )}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.id}>
              <ProductCard p={p} headingLevel={2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="soft-card mt-4 px-6 py-10 text-center">
          <p className="font-display text-2xl text-wine">Nothing matches that yet</p>
          <p className="mt-2 text-ink-soft">Try another word, or browse everything.</p>
          <Link href="/products" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-wine px-5 font-bold text-white hover:bg-rose">
            See all gifts
          </Link>
        </div>
      )}
    </div>
  );
}
