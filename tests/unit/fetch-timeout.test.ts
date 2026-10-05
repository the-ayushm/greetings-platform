import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout } from "@/lib/supabase/fetch-timeout";

describe("Supabase fetch deadline", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("attaches a deadline signal to every request", async () => {
    const seen: (AbortSignal | undefined)[] = [];
    vi.stubGlobal("fetch", async (_: unknown, init?: RequestInit) => {
      seen.push(init?.signal ?? undefined);
      return new Response("{}");
    });
    await fetchWithTimeout("http://x.invalid/rest");
    expect(seen[0]).toBeInstanceOf(AbortSignal);
    expect(seen[0]!.aborted).toBe(false);
  });

  it("still honours the caller's own abort signal", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", async (_: unknown, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Response("{}");
    });
    const ctl = new AbortController();
    await fetchWithTimeout("http://x.invalid/rest", { signal: ctl.signal });
    expect(signal!.aborted).toBe(false);
    ctl.abort();
    expect(signal!.aborted).toBe(true);
  });
});
