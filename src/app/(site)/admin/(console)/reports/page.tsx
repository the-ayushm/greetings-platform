import Link from "next/link";
import { AdminAction } from "@/components/AdminAction";
import { formatDateTime } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireAdminPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  await requireAdminPage();
  const { all } = await searchParams;
  const db = await userDb();
  let q = db.from("abuse_reports").select("id, site_id, reason, details, status, created_at, resolution_note").order("created_at", { ascending: false }).limit(100);
  if (!all) q = q.eq("status", "open");
  const { data } = await q;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Reports</h1>
      <p className="mt-1 text-sm">
        <Link className="underline" href={all ? "/admin/reports" : "/admin/reports?all=1"}>
          {all ? "Show open only" : "Show all"}
        </Link>
      </p>
      {!data?.length && <p className="mt-6 text-ink-soft">No reports.</p>}
      <ul className="mt-4 space-y-3">
        {(data ?? []).map((r) => (
          <li key={r.id} className="rounded-xl border-2 border-ink/15 bg-white p-4 text-sm">
            <p className="font-bold">
              {r.reason} · {r.status} · {formatDateTime(r.created_at)}
            </p>
            {r.details && <p className="mt-1 whitespace-pre-wrap text-ink-soft">{r.details}</p>}
            {r.site_id && (
              <p className="mt-1">
                Site:{" "}
                <Link className="font-mono underline" href={`/admin/sites/${r.site_id}`}>
                  {r.site_id.slice(0, 8)}
                </Link>
              </p>
            )}
            {r.status === "open" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <AdminAction url={`/api/admin/reports/${r.id}`} body={{ status: "actioned", disableSite: true }} label="Disable site & close" variant="danger" askReason={false} confirmText="Disable the reported site?" />
                <AdminAction url={`/api/admin/reports/${r.id}`} body={{ status: "dismissed" }} label="Dismiss" askReason={false} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
