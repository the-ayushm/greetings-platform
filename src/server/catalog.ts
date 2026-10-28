import "server-only";
import { adminDb } from "@/lib/supabase/admin";

const COLUMNS = "id, template_key, name, description, price_paise, currency, edit_days, live_days";

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

/** A specific product by id, if it (and its template) is on sale — used by checkout. */
export async function productById(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = adminDb();
  const { data } = await db.from("products").select(COLUMNS).eq("id", id).eq("is_active", true).maybeSingle();
  if (!data) return null;
  const { data: t } = await db.from("templates").select("key").eq("key", data.template_key).eq("is_active", true).maybeSingle();
  return t ? data : null;
}
