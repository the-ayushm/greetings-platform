import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAction } from "@/components/AdminAction";
import { Card, formatDateTime, formatINR } from "@/components/ui";
import { adminDb } from "@/lib/supabase/admin";
import { isUuid } from "@/server/http";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: { params: Promise<{ orderId: string }> }) {
  await requireAdminPage();
  const { orderId } = await params;
  if (!isUuid(orderId)) notFound();
  // Admin-only page (guarded by the console layout); explicit column lists, never content.
  const db = adminDb();
  const { data: o } = await db.from("orders").select("*, profiles(email)").eq("id", orderId).maybeSingle();
  if (!o) notFound();
  const [{ data: payments }, { data: site }, { data: events }] = await Promise.all([
    db.from("payments").select("*").eq("order_id", orderId).order("created_at"),
    db.from("sites").select("id, status").eq("order_id", orderId).maybeSingle(),
    o.razorpay_order_id ? db.from("payment_events").select("id, event_type, received_at, processed_at, error").eq("razorpay_order_id", o.razorpay_order_id).order("received_at") : Promise.resolve({ data: [] }),
  ]);
  return (
    <>
      <p className="text-sm">
        <Link className="underline" href="/admin/orders">
          ← Orders
        </Link>
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Order {o.id.slice(0, 8)}</h1>
      <Card className="mt-4">
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <dt className="text-ink-soft">Customer</dt>
          <dd>{(o.profiles as { email?: string } | null)?.email ?? "deleted account"}</dd>
          <dt className="text-ink-soft">Amount</dt>
          <dd>{formatINR(o.amount_paise)}</dd>
          <dt className="text-ink-soft">Status</dt>
          <dd className="capitalize">{o.status.replace("_", " ")}</dd>
          <dt className="text-ink-soft">Razorpay order</dt>
          <dd className="font-mono">{o.razorpay_order_id ?? "—"}</dd>
          <dt className="text-ink-soft">Created / paid</dt>
          <dd>
            {formatDateTime(o.created_at)} / {formatDateTime(o.paid_at)}
          </dd>
          <dt className="text-ink-soft">Site</dt>
          <dd>{site ? <Link className="underline" href={`/admin/sites/${site.id}`}>{site.status}</Link> : "—"}</dd>
        </dl>
        {o.status === "paid" && (
          <div className="mt-4">
            <AdminAction url={`/api/admin/orders/${o.id}/refund`} label="Refund in full" variant="danger" confirmText="Refund this order in full? The customer's site will be disabled when the refund completes." />
          </div>
        )}
      </Card>
      <h2 className="mt-6 text-lg font-extrabold">Payments</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {(payments ?? []).map((p) => (
          <li key={p.id} className="rounded-lg border-2 border-ink/10 bg-white px-3 py-2">
            <span className="font-mono">{p.razorpay_payment_id}</span> · {formatINR(p.amount_paise)} · {p.status}
            {p.is_duplicate && " · DUPLICATE"}
            {p.refund_status && ` · refund ${p.refund_status}`}
            {p.error_code && ` · ${p.error_code}`}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-lg font-extrabold">Webhook events</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {(events ?? []).map((e) => (
          <li key={e.id} className="rounded-lg border-2 border-ink/10 bg-white px-3 py-2">
            {e.event_type} · {formatDateTime(e.received_at)} · {e.processed_at ? "processed" : <strong className="text-rose">unprocessed{e.error ? `: ${e.error}` : ""}</strong>}
          </li>
        ))}
      </ul>
    </>
  );
}
