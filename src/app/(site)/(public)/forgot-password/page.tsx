import type { Metadata } from "next";
import { PageShell } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { ForgotForm } from "./ForgotForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Forgot your password?</h1>
      <p className="mt-2 text-ink-soft">No problem — you don&apos;t need the old one. Enter your email and we&apos;ll send you a link to set a new password.</p>
      <ForgotForm loginHref={`/login${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}`} />
    </PageShell>
  );
}
