import { formatINR } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireAdminPage } from "@/server/auth";
import { CatalogControls } from "./CatalogControls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Templates & pricing" };

export default async function AdminCatalog() {
  await requireAdminPage();
  const db = await userDb();
  const [{ data: templates }, { data: versions }, { data: products }] = await Promise.all([
    db.from("templates").select("key, name, is_active"),
    db.from("template_versions").select("template_key, version, schema_version, is_current, released_at, notes"),
    db.from("products").select("id, name, template_key, price_paise, is_active, edit_days, live_days"),
  ]);
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
            <CatalogControls kind="template" id={t.key} active={t.is_active} />
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-extrabold">Products</h2>
      <ul className="mt-2 space-y-3">
        {(products ?? []).map((p) => (
          <li key={p.id} className="rounded-xl border-2 border-ink/15 bg-white p-4 text-sm">
            <p className="font-bold">
              {p.name} · {formatINR(p.price_paise)} · {p.is_active ? "on sale" : "not on sale"}
            </p>
            <p className="text-ink-soft">
              Template {p.template_key} · edit {p.edit_days} days · live {p.live_days} days
            </p>
            <CatalogControls kind="product" id={p.id} active={p.is_active} pricePaise={p.price_paise} />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-ink-soft">New template versions ship through a database migration (see docs/TEMPLATES.md), so code and content schema always change together.</p>
    </>
  );
}
