import "server-only";
import { adminDb } from "@/lib/supabase/admin";

const COLUMNS = "id, template_key, name, description, price_paise, currency, edit_days, live_days, is_active";

/**
 * Active product for a template's store pages (public data). Defaults to the original
 * scrapbook product so existing pages keep showing exactly what they did before. A product is
 * only on sale while both it and its template are active.
 */
export async function activeProduct(templateKey = "scrapbook") {
  const db = adminDb();
  const { data: t } = await db.from("templates").select("key").eq("key", templateKey).eq("is_active", true).maybeSingle();
  if (!t) return null;
  const { data } = await db.from("products").select(COLUMNS).eq("template_key", templateKey).eq("is_active", true).order("created_at").limit(1).maybeSingle();
  return data;
}

/**
 * The template's product for its store page. Customers only ever get an active one; with
 * `includeUnlisted` (MFA'd admins testing a product that isn't on sale yet) an inactive
 * product is returned too, so it can be previewed and acquired before publication.
 */
export async function storeProduct(templateKey: string, includeUnlisted: boolean) {
  const listed = await activeProduct(templateKey);
  if (listed || !includeUnlisted) return listed;
  const db = adminDb();
  const { data: t } = await db.from("templates").select("key").eq("key", templateKey).eq("is_active", true).maybeSingle();
  if (!t) return null;
  const { data } = await db.from("products").select(COLUMNS).eq("template_key", templateKey).order("created_at").limit(1).maybeSingle();
  return data;
}

/** A specific product by id, if it (and its template) is on sale — used by checkout. Admins may include unlisted ones. */
export async function productById(id: string, includeUnlisted = false) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = adminDb();
  let q = db.from("products").select(COLUMNS).eq("id", id);
  if (!includeUnlisted) q = q.eq("is_active", true);
  const { data } = await q.maybeSingle();
  if (!data) return null;
  const { data: t } = await db.from("templates").select("key").eq("key", data.template_key).eq("is_active", true).maybeSingle();
  return t ? data : null;
}
