import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildSteps, stepForTarget } from "@/templates/lovestory/context";
import { DEMO_CONTENT, newSiteContent } from "@/templates/lovestory/defaults";
import { draftContentSchema, isValidIsoDate, publishContentSchema, referencedAssets, respondableItem, type LoveContent } from "@/templates/lovestory/schema";
import { daysSince, daysUntil, formatDate, makeFill, RichText } from "@/templates/lovestory/text";
import { presetTheme, THEME_PRESETS, themeVars } from "@/templates/lovestory/theme";
import { isTemplateKey, templateDef } from "@/templates/registry";
import { photoUsage, stripAsset } from "@/app/(site)/(app)/dashboard/sites/[siteId]/edit/love/panels/Photos";

const A = "3f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const B = "4f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4c";
const clone = () => structuredClone(DEMO_CONTENT);

/** Demo content plus the photos that publishing requires. */
function publishable(): LoveContent {
  const c = clone();
  for (const p of c.scrapbook.photos) p.image = { assetId: A };
  for (const p of c.photowall.photos) p.image = { assetId: B };
  return c;
}

describe("love story schema", () => {
  it("accepts the demo as a draft, and as a publishable story once photos are added", () => {
    expect(draftContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
    expect(publishContentSchema.safeParse(publishable()).success).toBe(true);
  });

  it("lets new drafts be empty but publishing needs names, dates and photos", () => {
    const c = newSiteContent();
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    const r = publishContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["people.creatorName", "people.partnerName", "calendar.dates.0.date", "scrapbook.photos.0.image", "photowall.photos.0.image"]));
  });

  it("doesn't require photos for sections that are switched off", () => {
    const c = publishable();
    for (const p of c.scrapbook.photos) p.image = null;
    expect(publishContentSchema.safeParse(c).success).toBe(false);
    c.sections.find((s) => s.id === "scrapbook")!.enabled = false;
    expect(publishContentSchema.safeParse(c).success).toBe(true);
  });

  it("requires a song file only when 'upload our song' is chosen", () => {
    const c = publishable();
    c.music.mode = "file";
    expect(publishContentSchema.safeParse(c).success).toBe(false);
    c.music.audio = { assetId: A };
    expect(publishContentSchema.safeParse(c).success).toBe(true);
  });

  it("rejects impossible dates, duplicate ids, and right answers that aren't options", () => {
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("2023-02-29")).toBe(false);
    expect(isValidIsoDate("2023-13-01")).toBe(false);
    const d = clone();
    d.timeline.events[0]!.date = "2023-02-30";
    expect(draftContentSchema.safeParse(d).success).toBe(false);
    const e = clone();
    e.coupons.items[1]!.id = e.coupons.items[0]!.id;
    expect(draftContentSchema.safeParse(e).success).toBe(false);
    const f = clone();
    const q = f.quiz.questions[0]!;
    if (q.type !== "choice") throw new Error("fixture");
    q.correct = 4;
    expect(draftContentSchema.safeParse(f).success).toBe(false);
  });

  it("enforces list sizes and section integrity even for drafts", () => {
    const c = clone();
    c.scrapbook.photos = Array.from({ length: 31 }, (_, i) => ({ id: `p${String(i).padStart(4, "0")}`, image: null, caption: "", date: "", category: "" }));
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    const s = clone();
    s.sections[1] = { ...s.sections[0]! };
    expect(draftContentSchema.safeParse(s).success).toBe(false);
    const t = clone();
    t.theme.primary = "red; background:url(x)";
    expect(draftContentSchema.safeParse(t).success).toBe(false);
  });

  it("strips control and bidi-override characters but keeps Unicode", () => {
    const c = clone();
    c.people.partnerName = "प्रिया‮💖\u0007";
    const r = draftContentSchema.parse(c);
    expect(r.people.partnerName).toBe("प्रिया💖");
  });

  it("lists every referenced asset with its kind", () => {
    const c = publishable();
    c.welcome.photo = { assetId: A };
    c.music.audio = { assetId: B };
    const q = c.quiz.questions.find((x) => x.type === "image")!;
    if (q.type === "image") q.options[0]!.image = { assetId: B };
    const refs = referencedAssets(c);
    expect(refs).toContainEqual({ id: B, kind: "audio" });
    expect(refs.filter((r) => r.kind === "image").length).toBe(1 + 1 + c.scrapbook.photos.length + c.photowall.photos.length);
  });

  it("only accepts responses for items of the matching kind (labels come from the content)", () => {
    expect(respondableItem(DEMO_CONTENT, "text", "qwhatami")).toContain("What am I to you");
    expect(respondableItem(DEMO_CONTENT, "slider", "qwhatami")).toBeNull();
    expect(respondableItem(DEMO_CONTENT, "coupon", "khug")).toBe("One Tight Hug");
    expect(respondableItem(DEMO_CONTENT, "coupon", "nope")).toBeNull();
  });
});

describe("love story text & dates", () => {
  it("fills tokens as plain text", () => {
    const c = clone();
    c.people.partnerName = "Aanya";
    c.people.creatorName = "Kabir";
    c.people.startDate = "2024-01-01";
    const fill = makeFill(c, new Date(2024, 0, 11));
    expect(fill("Hey {partner}, love {me} · {days} days")).toBe("Hey Aanya, love Kabir · 10 days");
  });

  it("formats dates the same everywhere and counts days to yearly dates", () => {
    expect(formatDate("2023-01-12")).toBe("12 Jan 2023");
    expect(daysSince("2024-01-01", new Date(2024, 0, 2))).toBe(1);
    expect(daysUntil("2001-10-20", true, new Date(2026, 9, 14))).toBe(6);
    expect(daysUntil("2001-01-02", true, new Date(2026, 9, 14))).toBe(80);
    expect(daysUntil("2020-01-01", false, new Date(2026, 9, 14))).toBeNull();
  });

  it("renders the letter's limited formatting without ever producing HTML from text", () => {
    const html = renderToStaticMarkup(createElement(RichText, { text: "**hi** <script>alert(1)</script>\n\n- one\n- *two*" }));
    expect(html).toContain("<strong>hi</strong>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<li><em>two</em></li>");
  });

  it("builds steps from enabled sections in order, welcome first and final last", () => {
    const c = clone();
    c.sections = [...c.sections].reverse();
    c.sections.find((s) => s.id === "coupons")!.enabled = false;
    const steps = buildSteps(c);
    expect(steps[0]!.kind).toBe("welcome");
    expect(steps.at(-1)!.kind).toBe("final");
    expect(steps.some((s) => s.kind === "coupons")).toBe(false);
    expect(steps.filter((s) => s.kind === "question").length).toBe(c.quiz.questions.length);
    expect(steps[1]!.kind).toBe("photowall");
    expect(steps[stepForTarget(steps, "quiz")]!.kind).toBe("question");
    expect(stepForTarget(steps, "nonsense")).toBe(0);
  });
});

describe("love story themes", () => {
  it("every preset is valid content and produces only colours and font stacks", () => {
    for (const k of Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]) {
      const c = clone();
      c.theme = presetTheme(k, { motion: "subtle", hearts: true, sparkles: true, lights: true });
      expect(draftContentSchema.safeParse(c).success).toBe(true);
      for (const v of Object.values(themeVars(c.theme))) expect(v).toMatch(/^(#[0-9a-f]{6}|rgba\([\d.,]+\)|[ ,'A-Za-z-]+)$/);
    }
  });
});

describe("template registry", () => {
  it("resolves both templates and their public paths", () => {
    expect(isTemplateKey("lovestory")).toBe(true);
    expect(isTemplateKey("nope")).toBe(false);
    expect(templateDef("lovestory").path).toBe("love");
    expect(templateDef("scrapbook").path).toBe("birthday");
    expect(() => templateDef("nope")).toThrow();
    expect(templateDef("lovestory").parseDraft(DEMO_CONTENT).success).toBe(true);
    // A scrapbook draft is not a love story draft (and vice versa).
    expect(templateDef("scrapbook").parseDraft(DEMO_CONTENT).success).toBe(false);
    expect(templateDef("lovestory").recipientName({ people: { partnerName: " Aanya " } })).toBe("Aanya");
  });
});

describe("studio photo library helpers", () => {
  it("knows where each photo is used and removes every reference before deletion", () => {
    const c = publishable();
    c.final.photo = { assetId: A };
    expect(photoUsage(c).get(A)).toEqual(expect.arrayContaining(["Scrapbook", "Final"]));
    stripAsset(c, A);
    expect(referencedAssets(c).some((r) => r.id === A)).toBe(false);
    expect(referencedAssets(c).some((r) => r.id === B)).toBe(true);
  });
});
