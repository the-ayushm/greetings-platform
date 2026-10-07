import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { conflict, notFound } from "./http";

const db = () => adminDb();

export async function adminAudit(adminId: string, action: string, targetType: string, targetId: string, meta: Record<string, unknown> = {}) {
  await db().from("audit_log").insert({ actor_id: adminId, actor_role: "admin", action, target_type: targetType, target_id: targetId, meta: meta as { [k: string]: Json } });
}

export async function setSiteStatus(adminId: string, siteId: string, action: "disable" | "enable" | "extend", reason: string, days?: number) {
  const { data: site } = await db().from("sites").select("id, status, edit_until, expires_at, published_version_id").eq("id", siteId).maybeSingle();
  if (!site || site.status === "deleted") throw notFound();
  if (action === "disable") {
    if (site.status === "disabled") throw conflict("noop", "Already disabled.");
    await db().from("sites").update({ status: "disabled", disabled_reason: reason.slice(0, 200) || "admin" }).eq("id", siteId);
  } else if (action === "enable") {
    if (site.status !== "disabled") throw conflict("noop", "Site isn't disabled.");
    const { data: order } = await db().from("sites").select("orders!inner(status)").eq("id", siteId).single();
    if ((order as unknown as { orders: { status: string } }).orders.status === "refunded") throw conflict("refunded", "This order was refunded; the site can't be re-enabled.");
    await db().from("sites").update({ status: site.published_version_id ? "published" : "draft", disabled_reason: null }).eq("id", siteId);
  } else {
    const d = Math.min(Math.max(days ?? 7, 1), 365);
    const base = Math.max(Date.now(), new Date(site.edit_until).getTime());
    const editUntil = new Date(base + d * 86_400_000);
    const expires = new Date(Math.max(new Date(site.expires_at).getTime(), editUntil.getTime()));
    await db().from("sites").update({ edit_until: editUntil.toISOString(), expires_at: expires.toISOString() }).eq("id", siteId);
  }
  await adminAudit(adminId, `admin.site.${action}`, "site", siteId, { reason: reason.slice(0, 200), days });
  return { ok: true };
}

/** Customer content is hidden from admins by default; viewing it is deliberate and audited. */
export async function viewSiteContent(adminId: string, siteId: string, reason: string) {
  const { data: site } = await db().from("sites").select("id, draft_content, published_version_id").eq("id", siteId).maybeSingle();
  if (!site) throw notFound();
  const { data: v } = site.published_version_id ? await db().from("site_versions").select("content, version").eq("id", site.published_version_id).maybeSingle() : { data: null };
  await adminAudit(adminId, "admin.site.view_content", "site", siteId, { reason: reason.slice(0, 200) });
  return { draft: site.draft_content, published: v?.content ?? null, version: v?.version ?? null };
}

export async function resolveReport(adminId: string, reportId: string, status: "actioned" | "dismissed", note: string, disableSite: boolean) {
  const { data: r } = await db().from("abuse_reports").select("id, site_id, status").eq("id", reportId).maybeSingle();
  if (!r) throw notFound();
  if (disableSite && r.site_id) {
    await db().from("sites").update({ status: "disabled", disabled_reason: "content report" }).eq("id", r.site_id).neq("status", "deleted");
  }
  await db().from("abuse_reports").update({ status, resolution_note: note.slice(0, 500), resolved_by: adminId, resolved_at: new Date().toISOString() }).eq("id", reportId);
  await adminAudit(adminId, `admin.report.${status}`, "abuse_report", reportId, { disabledSite: disableSite ? r.site_id : null });
  return { ok: true };
}

export async function updateProduct(adminId: string, productId: string, patch: { pricePaise?: number; isActive?: boolean; editDays?: number; liveDays?: number }) {
  const { data: before } = await db().from("products").select("price_paise, is_active, edit_days, live_days").eq("id", productId).maybeSingle();
  if (!before) throw notFound();
  const upd: { price_paise?: number; is_active?: boolean; edit_days?: number; live_days?: number } = {};
  if (patch.pricePaise !== undefined) upd.price_paise = patch.pricePaise;
  if (patch.isActive !== undefined) upd.is_active = patch.isActive;
  if (patch.editDays !== undefined) upd.edit_days = patch.editDays;
  if (patch.liveDays !== undefined) upd.live_days = patch.liveDays;
  await db().from("products").update(upd).eq("id", productId);
  await adminAudit(adminId, "admin.product.update", "product", productId, { before, after: upd });
  return { ok: true };
}

export async function updateTemplate(adminId: string, key: string, isActive: boolean) {
  const { data } = await db().from("templates").update({ is_active: isActive }).eq("key", key).select("key").maybeSingle();
  if (!data) throw notFound();
  await adminAudit(adminId, "admin.template.update", "template", key, { isActive });
  return { ok: true };
}

export async function stats() {
  const since = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  const head = { count: "exact" as const, head: true };
  const [customers, pendingOrders, published, openReports, failedEvents, paid, storage] = await Promise.all([
    db().from("profiles").select("id", head),
    db().from("orders").select("id", head).eq("status", "created"),
    db().from("sites").select("id", head).eq("status", "published"),
    db().from("abuse_reports").select("id", head).eq("status", "open"),
    db().from("payment_events").select("id", head).is("processed_at", null),
    db().from("orders").select("amount_paise, paid_at").in("status", ["paid", "refund_pending"]).gte("paid_at", since(30)),
    db().from("assets").select("bytes").eq("status", "ready"),
  ]);
  const paid30 = paid.data ?? [];
  const paid7 = paid30.filter((o) => (o.paid_at ?? "") >= since(7));
  return {
    customers: customers.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    published: published.count ?? 0,
    openReports: openReports.count ?? 0,
    failedEvents: failedEvents.count ?? 0,
    paid7: paid7.length,
    revenue7: paid7.reduce((n, o) => n + o.amount_paise, 0),
    revenue30: paid30.reduce((n, o) => n + o.amount_paise, 0),
    storageBytes: (storage.data ?? []).reduce((n, a) => n + (a.bytes ?? 0), 0),
  };
}
