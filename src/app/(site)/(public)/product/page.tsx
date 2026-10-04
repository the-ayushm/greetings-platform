import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, Notice, PageShell, formatINR } from "@/components/ui";
import { activeProduct } from "@/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing" };

export default async function ProductPage() {
  const p = await activeProduct();
  return (
    <PageShell narrow>
      <h1 className="font-display text-4xl font-semibold">Scrapbook Surprise</h1>
      <p className="mt-2 text-ink-soft">One personal birthday website, made by you, for one special person.</p>
      {!p ? (
        <div className="mt-6">
          <Notice tone="error">Sales are paused for a moment. Please check back soon.</Notice>
        </div>
      ) : (
        <Card className="mt-6">
          <p className="font-pixel text-4xl text-rose">{formatINR(p.price_paise)}</p>
          <p className="text-sm text-ink-soft">one-time payment · GST as applicable</p>
          <ul className="mt-5 space-y-2">
            <li>✓ Your own private link (and QR code)</li>
            <li>✓ Letter, up to 12 photos, coupons, reasons list</li>
            <li>✓ Upload your song (MP3/M4A/AAC, up to 8 minutes) or use our music box</li>
            <li>✓ Edit for {p.edit_days} days, live for {Math.round(p.live_days / 30)} months</li>
            <li>✓ Optional passcode, change the link any time</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={`/checkout?product=${p.id}`}>Buy now</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">
              See the demo first
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            Payments are processed by Razorpay. By buying you agree to our <Link className="underline" href="/legal/terms">terms</Link> and{" "}
            <Link className="underline" href="/legal/refund">refund policy</Link>.
          </p>
        </Card>
      )}
    </PageShell>
  );
}
