import "server-only";
import { adminDb } from "@/lib/supabase/admin";

/** Active product for the store pages (public data). */
export async function activeProduct() {
  const { data } = await adminDb().from("products").select("id, name, description, price_paise, currency, edit_days, live_days").eq("is_active", true).order("created_at").limit(1).maybeSingle();
  return data;
}
