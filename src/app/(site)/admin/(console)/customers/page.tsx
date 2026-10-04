import { requireAdminPage } from "@/server/auth";
import { formatDate } from "@/components/ui";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage();
  const { q = "" } = await searchParams;
  // Admin-only page (guarded by the console layout); explicit column lists, never content.
  const db = adminDb();
  let query = db.from("profiles").select("id, email, role, created_at, orders(count), sites(count)").order("created_at", { ascending: false }).limit(100);
  const term = q.trim().toLowerCase().replace(/[%_,()]/g, "");
  if (term) query = query.ilike("email", `%${term}%`);
  const { data } = await query;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Customers</h1>
      <form className="mt-4 flex gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search email" className="w-72 rounded-lg border-2 border-ink/20 px-3 py-1.5" />
        <button className="rounded-lg bg-ink px-3 py-1.5 font-bold text-white">Search</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-baby">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Orders</th>
              <th className="px-3 py-2">Sites</th>
              <th className="px-3 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-ink/10">
                <td className="px-3 py-2">{p.email}</td>
                <td className="px-3 py-2">{p.role}</td>
                <td className="px-3 py-2">{(p.orders as { count: number }[])[0]?.count ?? 0}</td>
                <td className="px-3 py-2">{(p.sites as { count: number }[])[0]?.count ?? 0}</td>
                <td className="px-3 py-2">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
