import { formatDateTime } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireAdminPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ actor?: string }> }) {
  await requireAdminPage();
  const { actor } = await searchParams;
  const db = await userDb();
  let q = db.from("audit_log").select("id, actor_id, actor_role, action, target_type, target_id, meta, created_at").order("created_at", { ascending: false }).limit(200);
  if (actor && ["admin", "customer", "system", "webhook"].includes(actor)) q = q.eq("actor_role", actor);
  const { data } = await q;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Audit log</h1>
      <form className="mt-3 flex gap-2 text-sm">
        <label className="sr-only" htmlFor="actor">
          Actor
        </label>
        <select id="actor" name="actor" defaultValue={actor ?? ""} className="rounded-lg border-2 border-ink/20 px-2 py-1.5">
          <option value="">all actors</option>
          <option>admin</option>
          <option>customer</option>
          <option>system</option>
          <option>webhook</option>
        </select>
        <button className="rounded-lg bg-ink px-3 py-1.5 font-bold text-white">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-baby">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l) => (
              <tr key={l.id} className="border-t border-ink/10 align-top">
                <td className="px-3 py-1.5 whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                <td className="px-3 py-1.5">
                  {l.actor_role}
                  {l.actor_id ? ` ${l.actor_id.slice(0, 8)}` : ""}
                </td>
                <td className="px-3 py-1.5">{l.action}</td>
                <td className="px-3 py-1.5 font-mono">
                  {l.target_type} {l.target_id?.slice(0, 8)}
                </td>
                <td className="px-3 py-1.5 font-mono break-all">{JSON.stringify(l.meta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
