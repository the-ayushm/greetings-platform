/** Browser-side JSON fetch with typed errors (used by the dashboard, editor and admin). */
export class ApiFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.body !== undefined ? { "content-type": "application/json" } : undefined,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiFailure(0, "network", "You seem to be offline. Please check your connection.");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } & Record<string, unknown> } & T;
  if (!res.ok) {
    const e = data.error ?? {};
    throw new ApiFailure(res.status, e.code ?? "error", e.message ?? "Something went wrong.", e);
  }
  return data as T;
}
