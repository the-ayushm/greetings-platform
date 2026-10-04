import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { formatDateTime, formatINR } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const STATUSES = ["all", "created", "paid", "refund_pending", "refunded", "expired"];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdminPage();
  const { status = "all", q = "" } = await searchParams;
  const db = await userDb();
  let query = db.from("orders").select("id, status, amount_paise, razorpay_order_id, created_at, paid_at, user_id, profiles(email)").order("created_at", { ascending: false }).limit(100);
  if (STATUSES.includes(status) && status !== "all") query = query.eq("status", status);
  const term = q.trim();
  if (/^order_[A-Za-z0-9]+$/.test(term)) query = query.eq("razorpay_order_id", term);
  else if (/^[0-9a-f-]{36}$/i.test(term)) query = query.eq("id", term);
  const { data } = await query;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Orders</h1>
      <form className="mt-4 flex flex-wrap gap-2 text-sm">
        <select name="status" defaultValue={status} className="rounded-lg border-2 border-ink/20 px-2 py-1.5">
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input name="q" defaultValue={q} placeholder="Order id or Razorpay order_…" className="w-72 rounded-lg border-2 border-ink/20 px-3 py-1.5" />
        <button className="rounded-lg bg-ink px-3 py-1.5 font-bold text-white">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-baby">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-t border-ink/10">
                <td className="px-3 py-2 font-mono">
                  <Link className="underline" href={`/admin/orders/${o.id}`}>
                    {o.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2">{(o.profiles as { email?: string } | null)?.email ?? <em className="text-ink-soft">deleted account</em>}</td>
                <td className="px-3 py-2">{formatINR(o.amount_paise)}</td>
                <td className="px-3 py-2 capitalize">{o.status.replace("_", " ")}</td>
                <td className="px-3 py-2">{formatDateTime(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
