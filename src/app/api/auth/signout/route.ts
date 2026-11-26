import { userDb } from "@/lib/supabase/server";
import { appOrigins } from "@/server/env";
import { json, requireOrigin, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  requireOrigin(req, appOrigins());
  const db = await userDb();
  await db.auth.signOut();
  return json({ ok: true });
});
