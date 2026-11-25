import { describe, expect, it } from "vitest";
import { PRODUCT_META } from "@/lib/store";
import { isTemplateKey, templateDef } from "@/templates/registry";
import { DEFAULT_SONG, shiftDemoDates, toInviteData } from "@/templates/vivah/adapter";
import { DEMO_CONTENT, DEMO_GALLERY, newSiteContent } from "@/templates/vivah/defaults";
import { coupleName, draftContentSchema, publishContentSchema, referencedAssets, waNumber, type VivahContent } from "@/templates/vivah/schema";

const A = "3f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const B = "4f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const ready = (): VivahContent => ({ ...structuredClone(DEMO_CONTENT), rsvp: { ...DEMO_CONTENT.rsvp, phone: "98765 43210" } });
const NOW = Date.parse("2026-11-25T06:00:00Z");

describe("vivah schema", () => {
  it("accepts the demo as a draft, and as a publishable invitation once a WhatsApp number is set", () => {
    expect(draftContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
    const r = publishContentSchema.safeParse(DEMO_CONTENT);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path.join("."))).toEqual(["rsvp.phone"]);
    expect(publishContentSchema.safeParse(ready()).success).toBe(true);
  });

  it("lets a new draft be empty, but publishing needs names, message, date, city, venues and dates", () => {
    const c = newSiteContent();
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    const r = publishContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["couple.groom.first", "couple.bride.first", "wedding.date", "wedding.city", "events.0.venue", "events.0.date", "rsvp.phone"]));
  });

  it("doesn't need a WhatsApp number when RSVP is switched off", () => {
    const c = ready();
    c.rsvp.phone = "";
    c.sections.rsvp = false;
    expect(publishContentSchema.safeParse(c).success).toBe(true);
  });

  it("rejects impossible dates and times, too many functions and duplicate ids", () => {
    for (const mutate of [
      (c: VivahContent) => void (c.wedding.date = "2027-02-30"),
      (c: VivahContent) => void (c.events[0]!.time = "25:00"),
      (c: VivahContent) => void (c.events = Array.from({ length: 9 }, (_, i) => ({ ...c.events[0]!, id: `ev${i}abcd` }))),
      (c: VivahContent) => void (c.events[1]!.id = c.events[0]!.id),
      (c: VivahContent) => void (c.rsvp.by = "2027-03-01"),
    ]) {
      const c = ready();
      mutate(c);
      expect(publishContentSchema.safeParse(c).success).toBe(false);
    }
  });

  it("cleans text (no control characters, collapsed spaces) and requires an uploaded song for 'file'", () => {
    const c = ready();
    c.couple.groom.first = "  Ru\u0000dra   ";
    const r = publishContentSchema.parse(c);
    expect(r.couple.groom.first).toBe("Rudra");
    c.music = { mode: "file", audio: null };
    expect(publishContentSchema.safeParse(c).success).toBe(false);
  });

  it("lists photo and (only when used) song assets", () => {
    const c = ready();
    c.gallery = [{ id: "pic1abcd", image: { assetId: A } }, { id: "pic2abcd", image: null }];
    c.music = { mode: "default", audio: { assetId: B } };
    expect(referencedAssets(c)).toEqual([{ id: A, kind: "image" }]);
    c.music.mode = "file";
    expect(referencedAssets(c)).toEqual([{ id: A, kind: "image" }, { id: B, kind: "audio" }]);
  });

  it("names the couple in the chosen order", () => {
    const c = ready();
    expect(coupleName(c)).toBe("Rudra & Gauri");
    c.couple.lead = "bride";
    expect(coupleName(c)).toBe("Gauri & Rudra");
    expect(templateDef("vivah").recipientName(c)).toBe("Gauri & Rudra");
  });
});

describe("waNumber", () => {
  it("normalises Indian and international numbers to WhatsApp format", () => {
    expect(waNumber("98765 43210")).toBe("919876543210");
    expect(waNumber("098765-43210")).toBe("919876543210");
    expect(waNumber("+91 98765 43210")).toBe("919876543210");
    expect(waNumber("0044 7700 900123")).toBe("447700900123");
    expect(waNumber("+1 (415) 555-0100")).toBe("14155550100");
  });
  it("rejects things that can't be a phone number", () => {
    for (const v of ["", "12345", "abc", "0000000000000000000"]) expect(waNumber(v)).toBe("");
  });
});

describe("vivah adapter", () => {
  it("builds the runtime data in IST, with the default song and the WhatsApp number", () => {
    const { data, strings } = toInviteData(ready(), { images: {}, audio: {} }, { brandHref: "https://app.example" });
    expect(data.date).toBe("2027-02-18T11:00:00+05:30");
    expect(data.events[3]).toMatchObject({ name: "Reception", start: "2027-02-18T19:30:00+05:30", noTime: false });
    expect(data.music).toBe(DEFAULT_SONG);
    expect(data.rsvp).toEqual({ phone: "919876543210", by: "2027-02-05T00:00:00+05:30", maxGuests: 12, demo: false });
    expect(data.hide).toEqual([]);
    expect(strings.openingLine).toEqual(["Written by destiny,", "blessed by Mahadev"]);
  });

  it("uses signed URLs for the couple's photos and song, and hides switched-off sections", () => {
    const c = ready();
    c.gallery = [{ id: "pic1abcd", image: { assetId: A } }, { id: "pic2abcd", image: { assetId: B } }];
    c.music = { mode: "file", audio: { assetId: B } };
    c.sections.scratch = false;
    const { data } = toInviteData(c, { images: { [A]: { src: "https://s/a.jpg" } }, audio: { [B]: { src: "https://s/b.mp3" } } }, { brandHref: "x" });
    expect(data.gallery).toEqual(["https://s/a.jpg"]);
    expect(data.music).toBe("https://s/b.mp3");
    expect(data.hide).toEqual(["scratch"]);
    c.music.mode = "none";
    expect(toInviteData(c, { images: {}, audio: {} }, { brandHref: "x" }).data.music).toBeNull();
  });

  it("renders an empty draft with harmless stand-ins (studio preview never breaks)", () => {
    const { data } = toInviteData(newSiteContent(), { images: {}, audio: {} }, { brandHref: "x", now: NOW });
    expect(data.groom.first).toBe("Groom");
    expect(data.bride.first).toBe("Bride");
    expect(data.date).toBe("2027-02-23T11:00:00+05:30");
    expect(data.events.every((e) => e.start.startsWith("2027-02-23"))).toBe(true);
    expect(data.rsvp.phone).toBe("");
  });

  it("keeps the demo countdown live by moving every date together", () => {
    const c = shiftDemoDates(DEMO_CONTENT, 85, NOW);
    expect(c.wedding.date).toBe("2027-02-18");
    expect(c.events.map((e) => e.date)).toEqual(["2027-02-16", "2027-02-17", "2027-02-18", "2027-02-18"]);
    const later = shiftDemoDates(DEMO_CONTENT, 85, NOW + 30 * 86_400_000);
    expect(later.wedding.date).toBe("2027-03-20");
    expect(later.rsvp.by).toBe("2027-03-07");
    const { data } = toInviteData(c, { images: {}, audio: {} }, { brandHref: "x", demoGallery: DEMO_GALLERY, demo: true });
    expect(data.gallery).toHaveLength(4);
    expect(data.rsvp.demo).toBe(true);
  });
});

describe("vivah registration", () => {
  it("is a registered template with a store entry and its own renderer path", () => {
    expect(isTemplateKey("vivah")).toBe(true);
    const def = templateDef("vivah");
    expect(def.path).toBe("vivah");
    expect(def.previewPath("abc")).toBe("/preview/vivah/abc");
    expect(def.parsePublish(ready()).success).toBe(true);
    expect(PRODUCT_META.vivah?.categories).toContain("weddings");
  });
});
