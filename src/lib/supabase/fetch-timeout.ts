/**
 * fetch for server-side Supabase clients: every request gets a deadline, so a stalled database
 * or API makes our request fail fast (and get logged) instead of hanging until the platform
 * kills the function.
 */
export const SUPABASE_TIMEOUT_MS = 15_000;

export const fetchWithTimeout: typeof fetch = (input, init) => {
  const deadline = AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
  return fetch(input, { ...init, signal });
};
