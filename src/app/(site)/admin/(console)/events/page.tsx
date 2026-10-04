import { AdminAction } from "@/components/AdminAction";
import { formatDateTime } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireAdminPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment events" };

export default async function AdminEvents() {
  await requireAdminPage();
  const db = await userDb();
  const { data } = await db
    .from("payment_events")
    .select("id, event_type, razorpay_order_id, razorpay_payment_id, received_at, processed_at, attempts, error")
    .order("received_at", { ascending: false })
    .limit(150);
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Payment events</h1>
      <p className="mt-1 text-sm text-ink-soft">Webhooks from Razorpay. Unprocessed events are retried automatically every few minutes; you can also retry by hand.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-baby">
            <tr>
              <th className="px-3 py-2">Received</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Order / payment</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-t border-ink/10 align-top">
                <td className="px-3 py-2">{formatDateTime(e.received_at)}</td>
                <td className="px-3 py-2">{e.event_type}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {e.razorpay_order_id}
                  <br />
                  {e.razorpay_payment_id}
                </td>
                <td className="px-3 py-2">
                  {e.processed_at ? (
                    "processed"
                  ) : (
                    <span className="text-rose">
                      pending ({e.attempts}){e.error ? `: ${e.error}` : ""}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{!e.processed_at && <AdminAction url={`/api/admin/events/${e.id}/reprocess`} label="Retry" askReason={false} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
