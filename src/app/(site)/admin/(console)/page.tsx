import { requireAdminPage } from "@/server/auth";
import Link from "next/link";
import { Card, formatDateTime, formatINR } from "@/components/ui";
import { stats } from "@/server/admin";
import { userDb } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdminPage();
  const s = await stats();
  const db = await userDb();
  const { data: recent } = await db.from("orders").select("id, status, amount_paise, created_at, paid_at").order("created_at", { ascending: false }).limit(8);
  const tiles: [string, string, string?][] = [
    ["Revenue (7 days)", formatINR(s.revenue7)],
    ["Revenue (30 days)", formatINR(s.revenue30)],
    ["Paid orders (7 days)", String(s.paid7)],
    ["Customers", String(s.customers)],
    ["Live sites", String(s.published)],
    ["Unpaid open orders", String(s.pendingOrders), "/admin/orders?status=created"],
    ["Open reports", String(s.openReports), "/admin/reports"],
    ["Unprocessed payment events", String(s.failedEvents), "/admin/events"],
    ["Media storage", `${(s.storageBytes / 1024 / 1024).toFixed(1)} MB`],
  ];
  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Overview</h1>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {tiles.map(([label, value, href]) => (
          <li key={label}>
            <Card className="p-4">
              <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">{label}</p>
              <p className="mt-1 font-pixel text-2xl">{href ? <Link href={href} className="underline decoration-pink">{value}</Link> : value}</p>
            </Card>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-extrabold">Latest orders</h2>
      <ul className="mt-3 divide-y divide-ink/10 rounded-xl border-2 border-ink/15 bg-white">
        {(recent ?? []).map((o) => (
          <li key={o.id} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-sm">
            <Link className="font-mono underline" href={`/admin/orders/${o.id}`}>
              {o.id.slice(0, 8)}
            </Link>
            <span>{formatINR(o.amount_paise)}</span>
            <span className="capitalize">{o.status.replace("_", " ")}</span>
            <span className="text-ink-soft">{formatDateTime(o.paid_at ?? o.created_at)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
