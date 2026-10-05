import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/env";
import type { Database } from "./database.types";
import { fetchWithTimeout } from "./fetch-timeout";

/**
 * Service-role client: bypasses RLS. Server-only (the import above makes the build fail if
 * this module is ever pulled into a client bundle). Every caller must scope its own queries
 * to the authenticated owner — see src/server/sites.ts.
 */
let client: ReturnType<typeof createClient<Database>> | null = null;

export function adminDb() {
  if (!client) {
    client = createClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetchWithTimeout },
    });
  }
  return client;
}
