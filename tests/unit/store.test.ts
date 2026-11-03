import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryBySlug, discountPercent, filterProducts, isSort, NEW_DAYS, PRODUCT_META, priceLabel, toStoreProduct, type StoreRow } from "@/lib/store";
import { isTemplateKey } from "@/templates/registry";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 4);
const row = (k: string, price: number, extra: Partial<StoreRow> = {}): StoreRow => ({
  id: `00000000-0000-4000-8000-00000000000${price % 10}`,
  template_key: k,
  name: `${k} product`,
  description: "",
  price_paise: price,
  compare_at_paise: null,
  edit_days: 30,
  live_days: 365,
  is_featured: false,
  created_at: new Date(NOW - 100 * DAY).toISOString(),
  ...extra,
});
const list = () =>
  [row("scrapbook", 49_900, { created_at: new Date(NOW - 300 * DAY).toISOString() }), row("lovestory", 79_900, { is_featured: true }), row("wedding", 99_900), row("doyouloveme", 19_900, { created_at: new Date(NOW - 2 * DAY).toISOString() })]
    .map((r) => toStoreProduct(r, NOW)!)
    .filter(Boolean);

describe("storefront catalog", () => {
  it("describes every real template, and only real templates", () => {
    for (const k of Object.keys(PRODUCT_META)) expect(isTemplateKey(k), k).toBe(true);
    for (const k of ["scrapbook", "lovestory", "wedding", "doyouloveme"]) expect(PRODUCT_META[k], k).toBeDefined();
  });

  it("has unique category slugs, and every product's categories exist", () => {
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length);
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const m of Object.values(PRODUCT_META)) for (const c of m.categories) expect(ids.has(c)).toBe(true);
    expect(categoryBySlug("wedding-invitations")?.id).toBe("weddings");
    expect(categoryBySlug("nope")).toBeNull();
  });

  it("ignores database products the store doesn't know how to show", () => {
    expect(toStoreProduct(row("mystery", 100), NOW)).toBeNull();
  });

  it("only shows an original price / discount when it is genuinely higher", () => {
    const same = toStoreProduct(row("wedding", 49_900, { compare_at_paise: 49_900 }), NOW)!;
    expect(same.compareAtPaise).toBeNull();
    const lower = toStoreProduct(row("wedding", 49_900, { compare_at_paise: 30_000 }), NOW)!;
    expect(lower.compareAtPaise).toBeNull();
    const real = toStoreProduct(row("wedding", 49_900, { compare_at_paise: 99_900 }), NOW)!;
    expect(real.compareAtPaise).toBe(99_900);
    expect(discountPercent(real)).toBe(50);
  });

  it("marks products New only from their real creation date", () => {
    expect(toStoreProduct(row("wedding", 1, { created_at: new Date(NOW - (NEW_DAYS - 1) * DAY).toISOString() }), NOW)!.isNew).toBe(true);
    expect(toStoreProduct(row("wedding", 1, { created_at: new Date(NOW - (NEW_DAYS + 1) * DAY).toISOString() }), NOW)!.isNew).toBe(false);
  });

  it("filters by category and searches name, tagline and category names", () => {
    const all = list();
    expect(filterProducts(all, { category: "weddings" }).map((p) => p.templateKey)).toEqual(["wedding"]);
    expect(filterProducts(all, { category: "romance" }).map((p) => p.templateKey).sort()).toEqual(["doyouloveme", "lovestory"]);
    expect(filterProducts(all, { q: "WEDDING" }).map((p) => p.templateKey)).toEqual(["wedding"]);
    expect(filterProducts(all, { q: "birthday" }).map((p) => p.templateKey)).toContain("scrapbook");
    expect(filterProducts(all, { q: "only one answer" }).map((p) => p.templateKey)).toEqual(["doyouloveme"]);
    expect(filterProducts(all, { q: "zzz" })).toEqual([]);
  });

  it("sorts by featured, newest, price and name", () => {
    const all = list();
    expect(filterProducts(all, { sort: "featured" })[0]!.templateKey).toBe("lovestory");
    expect(filterProducts(all, { sort: "newest" })[0]!.templateKey).toBe("doyouloveme");
    expect(filterProducts(all, { sort: "price-asc" }).map((p) => p.pricePaise)).toEqual([19_900, 49_900, 79_900, 99_900]);
    expect(filterProducts(all, { sort: "price-desc" })[0]!.pricePaise).toBe(99_900);
    expect(filterProducts(all, { sort: "name" }).map((p) => p.name)).toEqual([...all.map((p) => p.name)].sort());
    expect(isSort("price-asc")).toBe(true);
    expect(isSort("drop table")).toBe(false);
  });

  it("formats prices in rupees, and ₹0 as Free", () => {
    expect(priceLabel(49_900)).toBe("₹499");
    expect(priceLabel(14_950)).toBe("₹149.50");
    expect(priceLabel(0)).toBe("Free");
  });
});
