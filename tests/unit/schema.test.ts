import { describe, expect, it } from "vitest";
import { addressSlug, makeFill } from "@/templates/scrapbook/context";
import { DEMO_CONTENT, newSiteContent } from "@/templates/scrapbook/defaults";
import { themeVars } from "@/templates/scrapbook/engine/theme";
import { cleanText, draftContentSchema, publishContentSchema, referencedAssets } from "@/templates/scrapbook/schema";

const clone = () => structuredClone(DEMO_CONTENT);
const UUID = "3f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("content schema", () => {
  it("accepts the demo content (legacy config) for publishing", () => {
    expect(publishContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
  });

  it("lets drafts have empty names but publishing requires them", () => {
    const c = newSiteContent();
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    const r = publishContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path.join("."))).toEqual(expect.arrayContaining(["recipientName", "senderName"]));
  });

  it("enforces max lengths and list sizes even for drafts", () => {
    const c = clone();
    c.recipientName = "x".repeat(41);
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    const d = clone();
    d.memories = Array.from({ length: 13 }, () => ({ image: null, caption: "" }));
    expect(draftContentSchema.safeParse(d).success).toBe(false);
    const e = clone();
    e.questions = [];
    expect(draftContentSchema.safeParse(e).success).toBe(false);
  });

  it("keeps full Unicode (Devanagari, Tamil, emoji, Arabic) intact", () => {
    const c = clone();
    c.recipientName = "प्रिया 💖";
    c.senderName = "அருண்";
    c.letter.body = ["جميلة ✨ नमस्ते"];
    const r = publishContentSchema.parse(c);
    expect(r.recipientName).toBe("प्रिया 💖");
    expect(r.senderName).toBe("அருண்");
    expect(r.letter.body[0]).toBe("جميلة ✨ नमस्ते");
  });

  it("treats HTML as plain text (never strips or interprets it)", () => {
    const c = clone();
    c.recipientName = '<img src=x onerror="alert(1)">';
    expect(publishContentSchema.parse(c).recipientName).toBe('<img src=x onerror="alert(1)">'.slice(0, 40));
  });

  it("removes control and bidi-override characters, normalises whitespace", () => {
    expect(cleanText("a‮b\u0000c​d")).toBe("abc​d");
    expect(cleanText("  hello \n  world  ")).toBe("hello world");
    expect(cleanText("p1\r\n\r\n\r\n\r\np2", true)).toBe("p1\n\np2");
  });

  it("rejects non-uuid media references and invalid theme colours", () => {
    const c = clone();
    (c.cover as { photo: unknown }).photo = { assetId: "../../etc/passwd" };
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    const d = clone();
    d.theme.pink = "red; background:url(https://evil)";
    expect(draftContentSchema.safeParse(d).success).toBe(false);
  });

  it("strips unknown keys", () => {
    const c = { ...clone(), __proto_pollution: { admin: true }, extra: "x" };
    const r = draftContentSchema.parse(c) as Record<string, unknown>;
    expect(r.extra).toBeUndefined();
    expect(r.__proto_pollution).toBeUndefined();
  });

  it("lists every referenced asset with its kind", () => {
    const c = clone();
    c.cover.photo = { assetId: UUID };
    c.song.audio = { assetId: "4f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b" };
    expect(referencedAssets(c)).toEqual([
      { id: UUID, kind: "image" },
      { id: "4f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b", kind: "audio" },
    ]);
  });
});

describe("renderer helpers", () => {
  it("fills {name} {sender} {pet} and scene tokens", () => {
    const fill = makeFill(DEMO_CONTENT);
    expect(fill("hi {name}, from {sender} to my {pet}")).toBe("hi My Love, from Your Name to my baby");
    expect(fill("{n} of {total} opened", { n: 2, total: 5 })).toBe("2 of 5 opened");
  });

  it("builds the cover address pill for any script (legacy bug: non-Latin names became '--')", () => {
    expect(addressSlug("My Love")).toBe("my-love");
    expect(addressSlug("प्रिया")).toBe("प्रिया");
    expect(addressSlug("!!!")).toBe("you");
  });

  it("computes color-mix fallbacks exactly", () => {
    const v = themeVars(DEMO_CONTENT.theme);
    expect(v["--pink"]).toBe("#f59ab8");
    expect(v["--cm-pink-38"]).toBe("rgba(245,154,184,0.38)");
    expect(v["--cm-red-70-white"]).toBe("rgb(224,126,143)");
  });
});
