import Link from "next/link";
import { formatINR } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { loveDefaults } from "@/server/admin";
import { requireAdminPage } from "@/server/auth";
import { THEME_PRESETS } from "@/templates/lovestory/theme";
import { CatalogControls } from "./CatalogControls";
import { LoveDefaults } from "./LoveDefaults";

/** Site counts per template and status (metadata only). */
async function siteCounts(keys: string[]) {
  const head = { count: "exact" as const, head: true };
  const out: Record<string, { published: number; draft: number; paid: number }> = {};
  await Promise.all(
    keys.map(async (k) => {
      const [pub, draft, paid] = await Promise.all([
        adminDb().from("sites").select("id", head).eq("template_key", k).eq("status", "published"),
        adminDb().from("sites").select("id", head).eq("template_key", k).eq("status", "draft"),
        adminDb().from("orders").select("id", head).eq("template_key", k).in("status", ["paid", "refund_pending"]),
      ]);
      out[k] = { published: pub.count ?? 0, draft: draft.count ?? 0, paid: paid.count ?? 0 };
    }),
  );
  return out;
}

/** Store page per template (admins can open a product's page before it's on sale). */
const STORE_PAGE: Record<string, string> = { scrapbook: "/product", lovestory: "/products/love-story", wedding: "/products/wedding-invitation" };
const DEMO_PAGE: Record<string, string> = { scrapbook: "/demo", lovestory: "/demo/love-story", wedding: "/demo/wedding" };

export const dynamic = "force-dynamic";
export const metadata = { title: "Templates & pricing" };

export default async function AdminCatalog() {
  await requireAdminPage();
  const db = await userDb();
  const [{ data: templates }, { data: versions }, { data: products }] = await Promise.all([
    db.from("templates").select("key, name, is_active"),
    db.from("template_versions").select("template_key, version, schema_version, is_current, released_at, notes"),
    db.from("products").select("id, name, description, template_key, price_paise, is_active, edit_days, live_days"),
  ]);
  const [counts, love] = await Promise.all([siteCounts((templates ?? []).map((t) => t.key)), loveDefaults()]);
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Templates & pricing</h1>
      <h2 className="mt-6 text-lg font-extrabold">Templates</h2>
      <ul className="mt-2 space-y-3">
        {(templates ?? []).map((t) => (
          <li key={t.key} className="rounded-xl border-2 border-ink/15 bg-white p-4 text-sm">
            <p className="font-bold">
              {t.name} <span className="font-mono text-ink-soft">({t.key})</span> · {t.is_active ? "active" : "inactive"}
            </p>
            <ul className="mt-1 text-ink-soft">
              {(versions ?? [])
                .filter((v) => v.template_key === t.key)
                .map((v) => (
                  <li key={v.version}>
                    v{v.version} (schema {v.schema_version}){v.is_current ? " · current" : ""} — {v.notes}
                  </li>
                ))}
            </ul>
            {counts[t.key] && (
              <p className="mt-1 text-ink-soft">
                {counts[t.key]!.paid} paid orders · {counts[t.key]!.published} published · {counts[t.key]!.draft} drafts
              </p>
            )}
            <CatalogControls kind="template" id={t.key} active={t.is_active} />
            {t.key === "lovestory" && love && (
              <LoveDefaults sections={love.sections} preset={love.preset} presets={Object.entries(THEME_PRESETS).map(([k, v]) => [k, v.label] as [string, string])} />
            )}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-extrabold">Products</h2>
      <ul className="mt-2 space-y-3">
        {(products ?? []).map((p) => (
          <li key={p.id} className="rounded-xl border-2 border-ink/15 bg-white p-4 text-sm">
            <p className="font-bold">
              {p.name} · {p.price_paise === 0 ? "Free (₹0)" : formatINR(p.price_paise)} · {p.is_active ? "on sale" : "not on sale — testing (admins only)"}
            </p>
            <p className="text-ink-soft">
              Template {p.template_key} · edit {p.edit_days} days · live {p.live_days} days
            </p>
            {STORE_PAGE[p.template_key] && (
              <p className="mt-1 flex flex-wrap gap-3 font-bold">
                <Link className="text-rose underline" href={STORE_PAGE[p.template_key]!} target="_blank">
                  {p.is_active ? "Store page ↗" : "Preview store page ↗"}
                </Link>
                <Link className="text-rose underline" href={DEMO_PAGE[p.template_key]!} target="_blank">
                  Live demo ↗
                </Link>
              </p>
            )}
            <CatalogControls kind="product" id={p.id} active={p.is_active} pricePaise={p.price_paise} editDays={p.edit_days} liveDays={p.live_days} name={p.name} description={p.description} />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-ink-soft">New template versions ship through a database migration (see docs/TEMPLATES.md), so code and content schema always change together.</p>
    </>
  );
}
