import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/server/env";
import type { Database } from "./database.types";
import { fetchWithTimeout } from "./fetch-timeout";

/**
 * Per-request client acting as the signed-in user (publishable key + the user's session
 * cookie). Every query through it is filtered by Row Level Security.
 */
export async function userDb() {
  const store = await cookies();
  return createServerClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: fetchWithTimeout },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session cookie instead.
        }
      },
    },
  });
}
