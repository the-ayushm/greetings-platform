import type { Metadata } from "next";
import { Card, Notice, PageShell, formatINR } from "@/components/ui";
import { requireUserPage } from "@/server/auth";
import { activeProduct } from "@/server/catalog";
import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productId } = await searchParams;
  const user = await requireUserPage(`/checkout${productId ? `?product=${encodeURIComponent(productId)}` : ""}`);
  const p = await activeProduct();
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      {!p || (productId && productId !== p.id) ? (
        <div className="mt-6">
          <Notice tone="error">That product isn&apos;t available. Please go back to the pricing page.</Notice>
        </div>
      ) : (
        <Card className="mt-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-ink-soft">Edit for {p.edit_days} days · live for 1 year</p>
            </div>
            <p className="font-pixel text-2xl text-rose">{formatINR(p.price_paise)}</p>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Signed in as {user.email}. Your website is created as soon as the payment is confirmed.</p>
          <CheckoutButton productId={p.id} email={user.email} label={`Pay ${formatINR(p.price_paise)}`} />
        </Card>
      )}
    </PageShell>
  );
}
