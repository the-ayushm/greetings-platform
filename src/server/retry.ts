import "server-only";
import { ApiError } from "./http";
import { log } from "./log";

/** Network blips and pool timeouts from Storage are worth retrying; 4xx answers are not. */
export function isTransient(err: unknown): boolean {
  if (!err) return false;
  const e = err as { status?: number; statusCode?: string | number; message?: string; name?: string };
  const status = Number(e.status ?? e.statusCode ?? 0);
  if (status >= 500) return true;
  return /timed out|timeout|ECONNRESET|ECONNREFUSED|fetch failed|socket|network|StorageUnknownError/i.test(`${e.name ?? ""} ${e.message ?? ""}`);
}

/**
 * Runs a Supabase Storage call (which reports failures as `{ error }`) with up to `tries`
 * attempts and jittered exponential backoff for transient errors only.
 */
export async function storageCall<T extends { error: unknown }>(label: string, fn: () => Promise<T>, tries = 3): Promise<T> {
  let r = await fn();
  for (let i = 1; i < tries && r.error && isTransient(r.error); i++) {
    log.warn("storage.retry", { op: label, attempt: i });
    await new Promise((res) => setTimeout(res, 250 * 2 ** (i - 1) + Math.random() * 150));
    r = await fn();
  }
  return r;
}

/** What the customer sees when Storage is still unavailable after retries. */
export const storageBusy = () => new ApiError(503, "storage_busy", "Uploads are busy right now. Please try again in a moment.");
