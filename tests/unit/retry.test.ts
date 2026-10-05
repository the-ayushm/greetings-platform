import { describe, expect, it } from "vitest";
import { isTransient, storageCall } from "@/server/retry";

describe("storage retries", () => {
  it("classifies transient vs permanent errors", () => {
    expect(isTransient({ name: "StorageApiError", message: "The connection to the database timed out", status: 400 })).toBe(true);
    expect(isTransient({ status: 503, message: "unavailable" })).toBe(true);
    expect(isTransient(new TypeError("fetch failed"))).toBe(true);
    expect(isTransient({ status: 400, message: "mime type not supported" })).toBe(false);
    expect(isTransient({ status: 404, message: "Object not found" })).toBe(false);
    expect(isTransient(null)).toBe(false);
  });

  it("retries transient failures and stops on success", async () => {
    let calls = 0;
    const r = await storageCall("t", async () => (++calls < 3 ? { data: null, error: { status: 500, message: "boom" } } : { data: "ok", error: null }));
    expect(r.data).toBe("ok");
    expect(calls).toBe(3);
  });

  it("does not retry permanent failures, and gives up after the limit", async () => {
    let calls = 0;
    await storageCall("t", async () => (++calls, { data: null, error: { status: 400, message: "bad" } }));
    expect(calls).toBe(1);
    calls = 0;
    const r = await storageCall("t", async () => (++calls, { data: null, error: { status: 502, message: "bad gateway" } }));
    expect(calls).toBe(3);
    expect(r.error).toBeTruthy();
  });
});
