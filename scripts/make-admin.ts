/**
 * Grants the admin role to an existing account (they must have signed in once).
 * The admin console additionally requires TOTP MFA, enrolled on first visit to /admin.
 *   npx tsx scripts/make-admin.ts someone@yourdomain.in
 * Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY from the environment.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const { data, error } = await db.from("profiles").update({ role: "admin" }).eq("email", email).select("id");
if (error || !data?.length) {
  console.error(error?.message ?? "No account with that email. Ask them to sign in once first.");
  process.exit(1);
}
await db.from("audit_log").insert({ actor_role: "system", action: "admin.granted", target_type: "user", target_id: data[0]!.id });
console.log(`admin role granted to ${email}`);
