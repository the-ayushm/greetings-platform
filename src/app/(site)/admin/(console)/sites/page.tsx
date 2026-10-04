import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { formatDate } from "@/components/ui";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sites" };

const STATUSES = ["all", "draft", "published", "unpublished", "disabled", "expired", "deleted"];

/** Metadata only. Customer content is not shown here (see the audited "view content" action). */
export default async function AdminSites({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage();
  const { status = "all" } = await searchParams;
  // Admin-only page (guarded by the console layout); explicit column lists, never content.
  const db = adminDb();
  let query = db.from("sites").select("id, status, created_at, expires_at, edit_until, view_count, profiles(email)").order("created_at", { ascending: false }).limit(100);
  if (STATUSES.includes(status) && status !== "all") query = query.eq("status", status);
  const { data } = await query;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Sites</h1>
      <form className="mt-4 flex gap-2 text-sm">
        <select name="status" defaultValue={status} className="rounded-lg border-2 border-ink/20 px-2 py-1.5">
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="rounded-lg bg-ink px-3 py-1.5 font-bold text-white">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-baby">
            <tr>
              <th className="px-3 py-2">Site</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Views</th>
              <th className="px-3 py-2">Edit until</th>
              <th className="px-3 py-2">Expires</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-ink/10">
                <td className="px-3 py-2 font-mono">
                  <Link className="underline" href={`/admin/sites/${s.id}`}>
                    {s.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2">{(s.profiles as { email?: string } | null)?.email ?? "—"}</td>
                <td className="px-3 py-2">{s.status}</td>
                <td className="px-3 py-2">{s.view_count}</td>
                <td className="px-3 py-2">{formatDate(s.edit_until)}</td>
                <td className="px-3 py-2">{formatDate(s.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
