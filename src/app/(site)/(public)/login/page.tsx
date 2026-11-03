import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui";
import { safeNext } from "@/lib/safe-next";
import { currentUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }) {
  const { next: rawNext, error, mode } = await searchParams;
  const next = safeNext(rawNext);
  if (await currentUser()) redirect(next);
  return (
    <PageShell narrow>
      <LoginForm next={next} linkError={error} initialMode={mode === "signup" ? "signup" : "signin"} />
    </PageShell>
  );
}
