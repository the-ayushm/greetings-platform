import { userDb } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth";
import { uuidParam } from "@/server/guards";
import { json, notFound, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Order status for the post-payment screen (polls until the webhook has landed). RLS-scoped. */
export const GET = route<{ orderId: string }>(async (_req, { params }) => {
  await requireUser();
  const orderId = uuidParam((await params).orderId);
  const db = await userDb();
  const { data: order } = await db.from("orders").select("id, status, amount_paise, currency, created_at, paid_at, last_payment_error").eq("id", orderId).maybeSingle();
  if (!order) throw notFound();
  const { data: site } = await db.from("sites").select("id").eq("order_id", orderId).maybeSingle();
  return json({ ...order, siteId: site?.id ?? null });
});
