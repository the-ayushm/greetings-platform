import type { Metadata } from "next";
import { SignOutButton } from "@/components/SignOutButton";
import { Card, PageShell } from "@/components/ui";
import { requireUserPage } from "@/server/auth";
import { DeleteAccount } from "./DeleteAccount";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUserPage("/dashboard/account");
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Account</h1>
      <p className="mt-1 text-ink-soft">Signed in as {user.email}</p>
      <Card className="mt-6">
        <h2 className="text-lg font-extrabold">Download your data</h2>
        <p className="mt-1 text-sm text-ink-soft">A JSON file with your profile, orders and everything you wrote on your sites.</p>
        <a href="/api/account/export" className="mt-3 inline-flex min-h-11 items-center rounded-lg border-2 border-ink bg-white px-5 py-2.5 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-baby" data-testid="export">
          Download my data
        </a>
      </Card>
      <Card className="mt-6">
        <h2 className="text-lg font-extrabold">Sign out</h2>
        <p className="mt-1 text-sm text-ink-soft">Sign out of Birthday Surprise on this device.</p>
        <SignOutButton className="mt-3 inline-flex min-h-11 items-center rounded-lg border-2 border-ink bg-white px-5 py-2.5 font-bold shadow-[3px_3px_0_var(--color-ink)] hover:bg-baby" />
      </Card>
      <DeleteAccount />
    </PageShell>
  );
}
