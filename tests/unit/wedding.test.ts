import { describe, expect, it } from "vitest";
import { isTemplateKey, templateDef } from "@/templates/registry";
import { DEMO_CONTENT, newSiteContent } from "@/templates/wedding/defaults";
import { applyRsvpRules, coupleName, draftContentSchema, publishContentSchema, referencedAssets, rsvpInputSchema, rsvpNameKey, type WeddingContent } from "@/templates/wedding/schema";
import { presetTheme, THEME_PRESETS, themeVars } from "@/templates/wedding/theme";
import { countdown, endOfDay, eventInstant, formatDots, formatLong, formatTime, googleCalendarUrl, icsDataUrl, mapsEmbedUrl, mapsUrl, rsvpClosesAt } from "@/templates/wedding/time";

const A = "3f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const clone = (): WeddingContent => structuredClone(DEMO_CONTENT);
const reply = (v: Partial<{ name: string; attending: boolean; guests: number; message: string }>) => rsvpInputSchema.safeParse({ name: "Priya Sharma", attending: true, guests: 2, message: "", ...v });

describe("wedding schema", () => {
  it("accepts the demo as a draft and as a publishable invitation", () => {
    expect(draftContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
    expect(publishContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
  });

  it("lets a new draft be empty, but publishing needs names, initials, date, time and venue", () => {
    const c = newSiteContent();
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    const r = publishContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["couple.brideName", "couple.groomName", "couple.initials", "event.date", "location.venueName"]));
  });

  it("rejects impossible dates, times, offsets and colours", () => {
    for (const [path, value] of [
      ["date", "2026-02-30"],
      ["time", "25:00"],
      ["utcOffset", "+05:31"],
    ] as const) {
      const c = clone();
      c.event[path] = value;
      expect(publishContentSchema.safeParse(c).success, path).toBe(false);
    }
    const c = clone();
    c.theme.burgundy = "red; background:url(x)";
    expect(draftContentSchema.safeParse(c).success).toBe(false);
  });

  it("keeps customer text as plain text (control characters stripped, nothing interpreted)", () => {
    const c = clone();
    c.couple.brideName = "<img src=x onerror=alert(1)>\u0007";
    const r = publishContentSchema.parse(c);
    expect(r.couple.brideName).toBe("<img src=x onerror=alert(1)>");
  });

  it("needs a song when the file music mode is chosen, and a deadline on/before the wedding", () => {
    const c = clone();
    c.music.mode = "file";
    c.rsvp.deadline = "2027-03-01";
    const paths = publishContentSchema.safeParse(c).error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["music.audio", "rsvp.deadline"]));
  });

  it("caps lists and refuses duplicate ids", () => {
    const c = clone();
    c.schedule.items.push({ ...c.schedule.items[0]! });
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    const d = clone();
    d.intro.photos = Array.from({ length: 4 }, (_, i) => ({ id: `photo${i}x`, image: null, caption: "" }));
    expect(draftContentSchema.safeParse(d).success).toBe(false);
  });

  it("lists exactly the referenced photos and song", () => {
    const c = clone();
    c.intro.photos = [{ id: "pone1x", image: { assetId: A }, caption: "" }];
    c.location.photo = { assetId: A };
    c.music = { ...c.music, mode: "file", audio: { assetId: A } };
    expect(referencedAssets(c)).toEqual([
      { id: A, kind: "image" },
      { id: A, kind: "image" },
      { id: A, kind: "audio" },
    ]);
  });

  it("is registered with its own public path and generated seed defaults", () => {
    expect(isTemplateKey("wedding")).toBe(true);
    const def = templateDef("wedding");
    expect(def.path).toBe("wedding");
    expect(def.parseDraft(def.newContent()).success).toBe(true);
    expect(def.recipientName(DEMO_CONTENT)).toBe("Meera & Arjun");
    expect(coupleName(DEMO_CONTENT)).toBe("Meera & Arjun");
  });
});

describe("RSVP rules", () => {
  it("requires a name and at least one guest when attending", () => {
    expect(reply({ name: " " }).success).toBe(false);
    expect(reply({ guests: 0 }).success).toBe(false);
    expect(reply({ guests: -1 }).success).toBe(false);
    expect(reply({ guests: 1.5 }).success).toBe(false);
    expect(reply({ guests: 21 }).success).toBe(false);
    expect(reply({ attending: false, guests: 0 }).success).toBe(true);
  });

  it("applies the couple's settings from the published content", () => {
    const c = clone();
    c.rsvp.maxGuests = 2;
    expect(applyRsvpRules(c, reply({ guests: 3 }).data!)).toEqual({ error: "You can reply for up to 2 guests." });
    // Declining always stores zero guests; messages are dropped when the couple turned them off.
    c.rsvp.askMessage = false;
    expect(applyRsvpRules(c, reply({ attending: false, guests: 0, message: "so sorry" }).data!)).toEqual({ row: { name: "Priya Sharma", attending: false, guests: 0, message: "" } });
  });

  it("treats the same name written differently as the same guest", () => {
    expect(rsvpNameKey("  Priya   SHARMA ")).toBe(rsvpNameKey("priya sharma"));
    expect(rsvpNameKey("Priya-Sharma")).toBe("priya sharma");
    expect(rsvpNameKey("प्रिया")).toBe("प्रिया");
  });

  it("closes at the end of the deadline day or when the wedding starts, whichever is first", () => {
    const c = clone();
    c.event = { date: "2027-02-14", time: "17:00", utcOffset: "+05:30" };
    c.rsvp.deadline = "";
    expect(rsvpClosesAt(c)?.toISOString()).toBe("2027-02-14T11:30:00.000Z");
    c.rsvp.deadline = "2027-02-01";
    expect(rsvpClosesAt(c)?.toISOString()).toBe("2027-02-01T18:29:59.999Z");
  });
});

describe("dates, countdown and links", () => {
  it("converts the venue's local start time to an instant", () => {
    expect(eventInstant("2026-10-10", "18:00", "+05:30")?.toISOString()).toBe("2026-10-10T12:30:00.000Z");
    expect(eventInstant("2026-10-10", "18:00", "-04:00")?.toISOString()).toBe("2026-10-10T22:00:00.000Z");
    expect(eventInstant("", "18:00", "+05:30")).toBeNull();
    expect(endOfDay("2026-10-10", "+00:00")?.toISOString()).toBe("2026-10-10T23:59:59.999Z");
  });

  it("counts down and never goes negative", () => {
    const t = new Date("2026-10-10T12:30:00Z");
    expect(countdown(t, new Date("2026-10-08T11:29:30Z"))).toEqual({ days: 2, hours: 1, minutes: 0, seconds: 30, done: false });
    expect(countdown(t, new Date("2026-10-10T12:30:00Z"))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
    expect(countdown(t, new Date("2027-01-01T00:00:00Z")).done).toBe(true);
  });

  it("formats dates and times like the printed card", () => {
    expect(formatDots("2026-10-10")).toBe("10.10.26");
    expect(formatLong("2026-11-20")).toBe("Friday, November 20, 2026");
    expect(formatTime("17:00", true)).toBe("5 PM");
    expect(formatTime("17:30")).toBe("5:30 PM");
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("nope")).toBe("");
  });

  it("builds map links for exactly the configured destination, encoded", () => {
    expect(mapsUrl("City Palace, Udaipur")).toBe("https://www.google.com/maps/search/?api=1&query=City%20Palace%2C%20Udaipur");
    expect(mapsUrl('"><script>')).not.toContain("<");
    expect(mapsEmbedUrl("12.97,77.59")).toBe("https://www.google.com/maps?q=12.97%2C77.59&output=embed");
  });

  it("makes save-the-date links with the right times", () => {
    const e = { title: "Meera & Arjun's Wedding", start: new Date("2026-10-10T12:30:00Z"), hours: 5, location: "Udaipur", details: "Hi, see you" };
    const g = new URL(googleCalendarUrl(e));
    expect(g.searchParams.get("dates")).toBe("20261010T123000Z/20261010T173000Z");
    expect(g.searchParams.get("text")).toBe("Meera & Arjun's Wedding");
    const ics = decodeURIComponent(icsDataUrl(e, "x@y").split(",").slice(1).join(","));
    expect(ics).toContain("DTSTART:20261010T123000Z");
    expect(ics).toContain("DESCRIPTION:Hi\\, see you");
  });
});

describe("wedding theme", () => {
  it("turns every preset into plain colour variables", () => {
    for (const k of Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]) {
      const vars = themeVars(presetTheme(k));
      for (const v of Object.values(vars)) expect(v).toMatch(/^(#[0-9a-f]{6}|rgba\(\d+,\d+,\d+,[\d.]+\))$/);
    }
  });
});
