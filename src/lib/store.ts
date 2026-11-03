/**
 * Digital Gifting storefront — the ONE place that describes how products appear in the store.
 *
 * Prices, names, descriptions and on-sale status live in the database (`products`, managed in
 * Admin → Templates & pricing). This file only adds what the database doesn't hold: which
 * categories a product belongs to, its links, its artwork and its short highlights. A product
 * appears in the store when it is on sale AND has an entry in PRODUCT_META.
 *
 * Adding a product: add its template (see docs/TEMPLATES.md), then one PRODUCT_META entry.
 * Adding a category: one CATEGORIES entry, and list it in the products that belong to it.
 */

export type CategoryId = "birthday" | "romance" | "love-stories" | "weddings" | "anniversary" | "interactive";
export type ArtKind = "scrapbook" | "lovestory" | "wedding" | "ask";

export type Category = {
  id: CategoryId;
  slug: string;
  title: string;
  /** One line for cards. */
  short: string;
  /** Category page intro. */
  description: string;
  /** Card / header gradient. */
  tint: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "birthday",
    slug: "birthday-surprises",
    title: "Birthday Surprises",
    short: "Make their day with a website that opens like a gift.",
    description: "Interactive birthday websites with your letter, photos, little surprises and their song — sent as one private link.",
    tint: "from-[#ffd7e2] to-[#fff1f4]",
  },
  {
    id: "romance",
    slug: "love-and-romance",
    title: "Love & Romance",
    short: "Sweet, playful ways to say what you feel.",
    description: "Romantic surprises for the person you love — from a playful question with only one answer to a whole little universe made for two.",
    tint: "from-[#ffc9d4] to-[#ffeef0]",
  },
  {
    id: "love-stories",
    slug: "love-stories",
    title: "Love Stories",
    short: "Your story, told as a website they can explore.",
    description: "Your timeline, memories, letters and special dates, turned into an interactive story only the two of you share.",
    tint: "from-[#e6d2f5] to-[#fbeef6]",
  },
  {
    id: "weddings",
    slug: "wedding-invitations",
    title: "Wedding Invitations",
    short: "Elegant invitations with RSVPs, maps and countdowns.",
    description: "Interactive wedding invitations your guests open on their phones — with a countdown, schedule, venue map and RSVPs.",
    tint: "from-[#f2d6c8] to-[#fbf1e8]",
  },
  {
    id: "anniversary",
    slug: "anniversary-gifts",
    title: "Anniversary Gifts",
    short: "Celebrate every year you've spent together.",
    description: "Look back on your journey together — your milestones, photos and promises in one heartfelt anniversary surprise.",
    tint: "from-[#ffdcc9] to-[#fff4ea]",
  },
  {
    id: "interactive",
    slug: "interactive-experiences",
    title: "Interactive Experiences",
    short: "Tap, play and discover — gifts that respond.",
    description: "Digital gifts that are meant to be played with: questions, envelopes, games and surprises that react to every tap.",
    tint: "from-[#d4ecdf] to-[#f3fbf6]",
  },
];

export type ProductMeta = {
  /** Store URL of the product detail page. */
  href: string;
  /** Public demo route (the real experience). */
  demo: string;
  /** Short label for chips and the demo showcase. */
  label: string;
  /** One line under the name on cards. */
  tagline: string;
  categories: CategoryId[];
  art: ArtKind;
  /** 3–4 genuine features of this product. */
  highlights: string[];
  /** Thumbnail background. */
  tint: string;
};

export const PRODUCT_META: Record<string, ProductMeta> = {
  scrapbook: {
    href: "/product",
    demo: "/demo",
    label: "Birthday",
    tagline: "A scrapbook-style birthday website",
    categories: ["birthday", "interactive"],
    art: "scrapbook",
    highlights: ["Letter in a wax-sealed envelope", "Up to 12 polaroid photos", "Love coupons & a cupcake wish", "Your song or a music box"],
    tint: "from-[#ffd7e2] via-[#ffe9ef] to-[#fff6f8]",
  },
  lovestory: {
    href: "/products/love-story",
    demo: "/demo/love-story",
    label: "Love Story",
    tagline: "Your relationship as an interactive story",
    categories: ["romance", "love-stories", "anniversary", "birthday"],
    art: "lovestory",
    highlights: ["Questions & a love meter", "Timeline, scrapbook and special dates", "Tabbed love letter & coupons", "Glowing final surprise"],
    tint: "from-[#2a1340] via-[#4a1236] to-[#6b1a35]",
  },
  wedding: {
    href: "/products/wedding-invitation",
    demo: "/demo/wedding",
    label: "Wedding",
    tagline: "An interactive wedding invitation",
    categories: ["weddings"],
    art: "wedding",
    highlights: ["Wax-sealed envelope opening", "Live countdown & schedule", "Venue map & dress code", "RSVPs in your dashboard"],
    tint: "from-[#3d111c] via-[#5b1727] to-[#7a2840]",
  },
  doyouloveme: {
    href: "/products/do-you-love-me",
    demo: "/demo/do-you-love-me",
    label: "Do You Love Me?",
    tagline: "A question with only one answer",
    categories: ["romance", "interactive"],
    art: "ask",
    highlights: ["Every “No” grows the YES button", "Full-screen YES moment", "Hearts, confetti & your message", "Know when they say yes"],
    tint: "from-[#ffc4cf] via-[#ffe1e6] to-[#fff0ea]",
  },
};

/** Genuine customer reviews only (none yet). The testimonials section stays hidden while empty. */
export type Review = { name: string; text: string; product?: string };
export const REVIEWS: Review[] = [];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug) ?? null;
export const categoryById = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

/** A product as the store shows it: the database row + its store metadata. */
export type StoreProduct = {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  pricePaise: number;
  /** Original price, only when it is genuinely higher than the price. */
  compareAtPaise: number | null;
  editDays: number;
  liveDays: number;
  featured: boolean;
  createdAt: string;
  isNew: boolean;
  meta: ProductMeta;
};

/** "New" badge: the product row was created within this many days (real data). */
export const NEW_DAYS = 45;

export type StoreRow = {
  id: string;
  template_key: string;
  name: string;
  description: string;
  price_paise: number;
  compare_at_paise: number | null;
  edit_days: number;
  live_days: number;
  is_featured: boolean;
  created_at: string;
};

export function toStoreProduct(r: StoreRow, now = Date.now()): StoreProduct | null {
  const meta = PRODUCT_META[r.template_key];
  if (!meta) return null;
  return {
    id: r.id,
    templateKey: r.template_key,
    name: r.name,
    description: r.description,
    pricePaise: r.price_paise,
    compareAtPaise: r.compare_at_paise && r.compare_at_paise > r.price_paise ? r.compare_at_paise : null,
    editDays: r.edit_days,
    liveDays: r.live_days,
    featured: r.is_featured,
    createdAt: r.created_at,
    isNew: now - new Date(r.created_at).getTime() < NEW_DAYS * 86_400_000,
    meta,
  };
}

export const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name", "Name (A–Z)"],
] as const;
export type SortId = (typeof SORTS)[number][0];
export const isSort = (v: unknown): v is SortId => SORTS.some(([k]) => k === v);

/** Search (name, tagline, description, category names), category filter and sort. */
export function filterProducts(list: StoreProduct[], opts: { q?: string; category?: CategoryId | null; sort?: SortId }) {
  const words = (opts.q ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean).slice(0, 8);
  let out = list.filter((p) => !opts.category || p.meta.categories.includes(opts.category));
  if (words.length) {
    out = out.filter((p) => {
      const hay = [p.name, p.meta.tagline, p.meta.label, p.description, ...p.meta.categories.map((c) => categoryById(c).title)].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  const sort = opts.sort ?? "featured";
  const by: Record<SortId, (a: StoreProduct, b: StoreProduct) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || a.createdAt.localeCompare(b.createdAt),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "price-asc": (a, b) => a.pricePaise - b.pricePaise,
    "price-desc": (a, b) => b.pricePaise - a.pricePaise,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return [...out].sort(by[sort]);
}

/** Price label shared by every card ("Free" for ₹0 test products). */
export const priceLabel = (paise: number) => (paise === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100));
export const discountPercent = (p: Pick<StoreProduct, "pricePaise" | "compareAtPaise">) => (p.compareAtPaise ? Math.round((1 - p.pricePaise / p.compareAtPaise) * 100) : 0);
