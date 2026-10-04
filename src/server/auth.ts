import "server-only";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase/admin";
import { userDb } from "@/lib/supabase/server";
import { ApiError, forbidden, unauthorized } from "./http";

export type SessionUser = { id: string; email: string; aal: "aal1" | "aal2" };

/** Verified identity from the session (JWT signature checked by Supabase, not just decoded). */
export async function currentUser(): Promise<SessionUser | null> {
  const db = await userDb();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const c = data.claims as { sub: string; email?: string; aal?: string };
  return { id: c.sub, email: c.email ?? "", aal: c.aal === "aal2" ? "aal2" : "aal1" };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw unauthorized();
  return u;
}

async function isAdminRole(userId: string) {
  const { data } = await adminDb().from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

/** API guard: admin role AND a multi-factor (aal2) session. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (!(await isAdminRole(u.id))) throw forbidden();
  if (u.aal !== "aal2") throw new ApiError(403, "mfa_required", "Verify with your authenticator app first.");
  return u;
}

/** Page guards (redirect instead of JSON). */
export async function requireUserPage(next: string): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireAdminPage(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/login?next=/admin");
  if (!(await isAdminRole(u.id))) redirect("/dashboard");
  if (u.aal !== "aal2") redirect("/admin/mfa");
  return u;
}

export async function isAdminUser(userId: string) {
  return isAdminRole(userId);
}
