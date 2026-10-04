"use client";

import { useEffect, useState } from "react";
import { ButtonLink, Card, Notice } from "@/components/ui";
import { api } from "@/lib/api-client";

type Order = { id: string; status: string; siteId: string | null; last_payment_error: string | null };

/** Waits for the payment webhook to land (usually a second or two), then links to the editor. */
export function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const o = await api<Order>(`/api/orders/${orderId}`);
        if (stop) return;
        setOrder(o);
        if (o.status === "paid" && o.siteId) return;
      } catch {
        /* keep polling */
      }
      if (Date.now() - started > 20_000) setSlow(true);
      if (!stop && Date.now() - started < 10 * 60_000) setTimeout(tick, 2000);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [orderId]);

  if (order?.status === "paid" && order.siteId) {
    return (
      <Card>
        <p className="font-hand text-2xl text-rose">yay ♡</p>
        <h1 className="font-display text-3xl font-semibold">Payment received</h1>
        <p className="mt-2 text-ink-soft">Your birthday website is ready to personalise.</p>
        <ButtonLink href={`/dashboard/sites/${order.siteId}/edit`} className="mt-6 w-full" data-testid="start-editing">
          Start personalising
        </ButtonLink>
      </Card>
    );
  }
  if (order && ["refunded", "refund_pending", "expired"].includes(order.status)) {
    return <Notice tone="error">This order is {order.status.replace("_", " ")}. If you think this is a mistake, contact us.</Notice>;
  }
  return (
    <Card>
      <h1 className="font-display text-2xl font-semibold">Confirming your payment…</h1>
      <p className="mt-2 text-ink-soft" role="status" aria-live="polite">
        This usually takes a few seconds. You can keep this page open.
      </p>
      {order?.last_payment_error && <p className="mt-3 text-sm text-rose">The last payment attempt didn&apos;t go through. You can try paying again from checkout.</p>}
      {slow && (
        <div className="mt-4">
          <Notice>
            Still waiting for the bank to confirm. If money left your account, your site will appear in <a className="underline" href="/dashboard">My sites</a> automatically
            — we check every few minutes.
          </Notice>
        </div>
      )}
    </Card>
  );
}
