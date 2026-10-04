import type { Metadata } from "next";
import { Card, PageShell } from "@/components/ui";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Contact us</h1>
      <Card className="mt-6 space-y-3">
        <p>
          Email: <strong>[support email]</strong> — we reply within one working day.
        </p>
        <p>
          Business: <strong>[Business legal name]</strong>, [registered address], India.
        </p>
        <p className="text-sm text-ink-soft">Please include your order ID for anything about a purchase. Never send us your card or UPI details.</p>
        <p className="text-sm text-ink-soft">To report a birthday page, use the small “report” link at the bottom of that page.</p>
      </Card>
    </PageShell>
  );
}
