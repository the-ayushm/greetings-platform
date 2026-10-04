import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui";
import { currentUser, isAdminUser } from "@/server/auth";
import { MfaForm } from "./MfaForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin verification", robots: { index: false } };

export default async function MfaPage() {
  const u = await currentUser();
  if (!u) redirect("/login?next=/admin/mfa");
  if (!(await isAdminUser(u.id))) redirect("/dashboard");
  if (u.aal === "aal2") redirect("/admin");
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Admin verification</h1>
      <p className="mt-2 text-ink-soft">The admin console requires an authenticator app (TOTP) code on every sign-in.</p>
      <MfaForm />
    </PageShell>
  );
}
