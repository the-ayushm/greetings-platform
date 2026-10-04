import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAction } from "@/components/AdminAction";
import { Card, formatDateTime } from "@/components/ui";
import { adminDb } from "@/lib/supabase/admin";
import { isUuid } from "@/server/http";
import { ContentViewer } from "./ContentViewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site" };

export default async function AdminSite({ params }: { params: Promise<{ siteId: string }> }) {
  await requireAdminPage();
  const { siteId } = await params;
  if (!isUuid(siteId)) notFound();
  // Admin-only page (guarded by the console layout); explicit column lists, never content.
  const db = adminDb();
  const { data: s } = await db
    .from("sites")
    .select("id, status, order_id, created_at, published_at, edit_until, expires_at, view_count, first_viewed_at, disabled_reason, passcode_hash, slug, profiles(email)")
    .eq("id", siteId)
    .maybeSingle();
  if (!s) notFound();
  const [{ data: assets }, { data: reports }, { data: log }] = await Promise.all([
    db.from("assets").select("id, kind, status, bytes, created_at").eq("site_id", siteId),
    db.from("abuse_reports").select("id, reason, status, created_at").eq("site_id", siteId),
    db.from("audit_log").select("id, action, actor_role, created_at").eq("target_type", "site").eq("target_id", siteId).order("created_at", { ascending: false }).limit(30),
  ]);
  return (
    <>
      <p className="text-sm">
        <Link className="underline" href="/admin/sites">
          ← Sites
        </Link>
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Site {s.id.slice(0, 8)}</h1>
      <Card className="mt-4">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <dt className="text-ink-soft">Owner</dt>
          <dd>{(s.profiles as { email?: string } | null)?.email ?? "—"}</dd>
          <dt className="text-ink-soft">Status</dt>
          <dd>
            {s.status}
            {s.disabled_reason ? ` (${s.disabled_reason})` : ""}
          </dd>
          <dt className="text-ink-soft">Order</dt>
          <dd>
            <Link className="font-mono underline" href={`/admin/orders/${s.order_id}`}>
              {s.order_id.slice(0, 8)}
            </Link>
          </dd>
          <dt className="text-ink-soft">Link / passcode</dt>
          <dd>
            {s.slug ? "has link" : "no link"} · {s.passcode_hash ? "passcode on" : "no passcode"}
          </dd>
          <dt className="text-ink-soft">Published</dt>
          <dd>{formatDateTime(s.published_at)}</dd>
          <dt className="text-ink-soft">Views</dt>
          <dd>
            {s.view_count} (first {formatDateTime(s.first_viewed_at)})
          </dd>
          <dt className="text-ink-soft">Edit until / expires</dt>
          <dd>
            {formatDateTime(s.edit_until)} / {formatDateTime(s.expires_at)}
          </dd>
          <dt className="text-ink-soft">Files</dt>
          <dd>
            {(assets ?? []).filter((a) => a.status === "ready").length} ready · {((assets ?? []).reduce((n, a) => n + (a.bytes ?? 0), 0) / 1048576).toFixed(1)} MB
          </dd>
        </dl>
        {s.status !== "deleted" && (
          <div className="mt-4 flex flex-wrap gap-2">
            {s.status === "disabled" ? (
              <AdminAction url={`/api/admin/sites/${s.id}`} body={{ action: "enable" }} label="Re-enable" />
            ) : (
              <AdminAction url={`/api/admin/sites/${s.id}`} body={{ action: "disable" }} label="Disable site" variant="danger" confirmText="Disable this site? Its link stops working immediately." />
            )}
            <AdminAction url={`/api/admin/sites/${s.id}`} body={{ action: "extend", days: 7 }} label="Extend editing 7 days" />
          </div>
        )}
      </Card>
      {s.status !== "deleted" && <ContentViewer siteId={s.id} />}
      {(reports ?? []).length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-extrabold">Reports</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {reports!.map((r) => (
              <li key={r.id}>
                {r.reason} · {r.status} · {formatDateTime(r.created_at)}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-6 text-lg font-extrabold">History</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {(log ?? []).map((l) => (
          <li key={l.id}>
            {formatDateTime(l.created_at)} · {l.actor_role} · {l.action}
          </li>
        ))}
      </ul>
    </>
  );
}
