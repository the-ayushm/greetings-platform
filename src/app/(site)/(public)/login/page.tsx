import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { currentUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  if (await currentUser()) redirect(next);
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-ink-soft">We&apos;ll email you a sign-in link. No password needed.</p>
      <LoginForm next={next} linkError={error} />
    </PageShell>
  );
}
