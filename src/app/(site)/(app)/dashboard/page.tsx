import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card, PageShell, formatDate, formatDateTime, formatINR } from "@/components/ui";
import { userDb } from "@/lib/supabase/server";
import { requireUserPage } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My sites" };

const STATUS: Record<string, { label: string; tone: "neutral" | "good" | "warn" | "bad" }> = {
  draft: { label: "Draft", tone: "warn" },
  published: { label: "Live", tone: "good" },
  unpublished: { label: "Unpublished", tone: "neutral" },
  disabled: { label: "Disabled", tone: "bad" },
  expired: { label: "Expired", tone: "neutral" },
};

export default async function Dashboard() {
  await requireUserPage("/dashboard");
  const db = await userDb();
  const [{ data: sites }, { data: orders }] = await Promise.all([
    db.from("sites").select("id, status, draft_content, edit_until, expires_at, view_count, first_viewed_at, created_at").order("created_at", { ascending: false }),
    db.from("orders").select("id, status, amount_paise, created_at, paid_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const paidOrders = (orders ?? []).filter((o) => o.status !== "created" && o.status !== "expired");

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">My birthday sites</h1>
          <p className="text-ink-soft">Edit, preview and share your surprises.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/dashboard/account" variant="ghost">
            Account
          </ButtonLink>
          <ButtonLink href="/product">New site</ButtonLink>
        </div>
      </div>

      {!sites?.length ? (
        <Card className="mt-8 text-center">
          <p className="font-hand text-2xl text-rose">nothing here yet ♡</p>
          <p className="mt-2 text-ink-soft">Buy a site to start personalising it. You&apos;ll see a live preview as you type.</p>
          <div className="mt-5 flex justify-center gap-3">
            <ButtonLink href="/product">Get started</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">
              See the demo
            </ButtonLink>
          </div>
        </Card>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {sites.map((s) => {
            const c = s.draft_content as { recipientName?: string };
            const st = STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
            const canEdit = ["draft", "published", "unpublished"].includes(s.status) && new Date(s.edit_until) > new Date();
            return (
              <li key={s.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold break-words">For {c.recipientName?.trim() || "someone special"} ♡</h2>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-ink-soft">Editable until</dt>
                    <dd>{formatDate(s.edit_until)}</dd>
                    <dt className="text-ink-soft">Live until</dt>
                    <dd>{formatDate(s.expires_at)}</dd>
                    <dt className="text-ink-soft">Opened</dt>
                    <dd>{s.first_viewed_at ? `${s.view_count}× · first ${formatDateTime(s.first_viewed_at)}` : "not yet"}</dd>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canEdit && (
                      <ButtonLink href={`/dashboard/sites/${s.id}/edit`} className="flex-1">
                        Edit
                      </ButtonLink>
                    )}
                    <ButtonLink href={`/dashboard/sites/${s.id}`} variant="secondary" className="flex-1">
                      Share & settings
                    </ButtonLink>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {paidOrders.length > 0 && (
        <section className="mt-12" aria-labelledby="orders">
          <h2 id="orders" className="font-display text-2xl font-semibold">Orders</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border-2 border-ink/15 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-baby">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Order</th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10">
                    <td className="px-4 py-2">{formatDate(o.paid_at ?? o.created_at)}</td>
                    <td className="px-4 py-2">{formatINR(o.amount_paise)}</td>
                    <td className="px-4 py-2 capitalize">{o.status.replace("_", " ")}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      <Link className="underline" href={`/dashboard/orders/${o.id}`}>
                        {o.id.slice(0, 8)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageShell>
  );
}
