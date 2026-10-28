import type { Metadata } from "next";
import { Card, Notice, PageShell, formatINR } from "@/components/ui";
import { canSeeUnlisted, requireUserPage } from "@/server/auth";
import { activeProduct, productById } from "@/server/catalog";
import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout" };

const BACK: Record<string, string> = { scrapbook: "/product", lovestory: "/products/love-story", wedding: "/products/wedding-invitation" };
const KIND: Record<string, string> = { scrapbook: "website", lovestory: "love story", wedding: "wedding invitation" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productId } = await searchParams;
  const user = await requireUserPage(`/checkout${productId ? `?product=${encodeURIComponent(productId)}` : ""}`);
  // No product in the URL keeps the original behaviour (the scrapbook product).
  const p = productId ? await productById(productId, await canSeeUnlisted(user)) : await activeProduct();
  const studio = p?.template_key === "lovestory" || p?.template_key === "wedding";
  const free = p?.price_paise === 0;
  const kind = KIND[p?.template_key ?? ""] ?? "website";
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      {!p ? (
        <div className="mt-6">
          <Notice tone="error">That product isn&apos;t available. Please go back to the pricing page.</Notice>
        </div>
      ) : (
        <Card className="mt-6">
          {!p.is_active && (
            <div className="mb-4">
              <Notice>
                <b>Testing mode:</b> this product isn&apos;t on sale yet — only admins can see and get it.
              </Notice>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-sm text-ink-soft">Edit for {p.edit_days} days · live for {p.live_days >= 365 ? `${Math.round(p.live_days / 365)} year${p.live_days >= 730 ? "s" : ""}` : `${p.live_days} days`}</p>
            </div>
            <p className="font-pixel text-2xl text-rose">{free ? "Free" : formatINR(p.price_paise)}</p>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Signed in as {user.email}. Your {kind} is created {free ? "straight away — no payment needed" : "as soon as the payment is confirmed"}
            {studio ? " — then you'll go straight to the customization studio." : "."}
          </p>
          <CheckoutButton productId={p.id} email={user.email} free={free} label={free ? "Get it free" : `Pay ${formatINR(p.price_paise)}`} />
          <p className="mt-4 text-center text-xs text-ink-soft">
            <a className="underline" href={BACK[p.template_key] ?? "/product"}>
              ← Back to product details
            </a>
          </p>
        </Card>
      )}
    </PageShell>
  );
}
