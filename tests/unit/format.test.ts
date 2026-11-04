import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatINR } from "@/components/ui";

describe("store and admin formatting", () => {
  it("always shows India time, whatever zone the server runs in (Vercel = UTC)", () => {
    // 19:01 UTC on 3 Nov is 00:31 IST on 4 Nov.
    expect(formatDateTime("2026-11-03T19:01:00Z")).toBe("4 Nov, 12:31 am");
    expect(formatDate("2026-11-03T19:01:00Z")).toBe("4 Nov 2026");
    expect(formatDateTime(null)).toBe("—");
  });

  it("formats rupees", () => {
    expect(formatINR(100)).toBe("₹1");
    expect(formatINR(49_900)).toBe("₹499");
  });
});
