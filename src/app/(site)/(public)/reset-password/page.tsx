import type { Metadata } from "next";
import { PageShell } from "@/components/ui";
import { ResetForm } from "./ResetForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

/** Lands here from the reset email (or from Account → Change password when signed in). */
export default function ResetPasswordPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Set a new password</h1>
      <p className="mt-2 text-ink-soft">Choose a new password — your old one isn&apos;t needed.</p>
      <ResetForm />
    </PageShell>
  );
}
