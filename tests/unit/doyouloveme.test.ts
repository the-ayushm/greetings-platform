import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { isTemplateKey, templateDef } from "@/templates/registry";
import { moodFor } from "@/templates/doyouloveme/art";
import { DEMO_CONTENT, newSiteContent, SUGGESTED_NO_MESSAGES } from "@/templates/doyouloveme/defaults";
import { answerSummary, draftContentSchema, fillTokens, growth, MAX_NO_MESSAGES, noLabel, publishContentSchema, referencedAssets, type AskContent } from "@/templates/doyouloveme/schema";
import { isDark, presetTheme, THEME_PRESETS, themeVars } from "@/templates/doyouloveme/theme";

const A = "3f1a2b3c-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const B = "7a1b2c3d-4e5f-4a60-9b7c-8d9e0f1a2b3c";
const clone = (): AskContent => structuredClone(DEMO_CONTENT);

describe("do you love me — schema", () => {
  it("accepts the demo as a draft and as a publishable page", () => {
    expect(draftContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
    expect(publishContentSchema.safeParse(DEMO_CONTENT).success).toBe(true);
  });

  it("lets a new draft be empty, but publishing needs both names", () => {
    const c = newSiteContent();
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    const r = publishContentSchema.safeParse(c);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.path.join("."))).toEqual(expect.arrayContaining(["people.partnerName", "people.senderName"]));
  });

  it("needs at least 3 and at most 20 “No” lines to publish, none of them empty", () => {
    const c = clone();
    c.question.noMessages = ["Are you sure?", "Really?"];
    expect(publishContentSchema.safeParse(c).success).toBe(false);
    expect(draftContentSchema.safeParse(c).success).toBe(true);
    c.question.noMessages = Array.from({ length: MAX_NO_MESSAGES + 1 }, (_, i) => `No ${i}`);
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    c.question.noMessages = ["One", "", "Three"];
    expect(publishContentSchema.safeParse(c).success).toBe(false);
  });

  it("rejects anything that isn't a plain #rrggbb colour (no CSS injection through the theme)", () => {
    const c = clone();
    c.theme.yes = "red; background:url(https://evil)";
    expect(draftContentSchema.safeParse(c).success).toBe(false);
    c.theme.yes = "#1F9E6E";
    expect(draftContentSchema.parse(c).theme.yes).toBe("#1f9e6e");
  });

  it("keeps customer text as plain text (control characters stripped, markup not interpreted)", () => {
    const c = clone();
    c.question.text = "<img src=x onerror=alert(1)>\u0007 ?";
    c.finale.message = "line one\r\n\r\n\r\n\r\nline two";
    const r = publishContentSchema.parse(c);
    expect(r.question.text).toBe("<img src=x onerror=alert(1)> ?");
    expect(r.finale.message).toBe("line one\n\nline two");
  });

  it("enforces length limits and the enums", () => {
    const c = clone();
    c.question.yesText = "Y".repeat(25);
    expect(publishContentSchema.safeParse(c).success).toBe(false);
    const d = clone() as unknown as { look: { character: string } };
    d.look.character = "dragon";
    expect(draftContentSchema.safeParse(d).success).toBe(false);
  });

  it("needs a song when the file music mode is chosen", () => {
    const c = clone();
    c.music.mode = "file";
    expect(publishContentSchema.safeParse(c).success).toBe(false);
    c.music.audio = { assetId: A };
    expect(publishContentSchema.safeParse(c).success).toBe(true);
  });

  it("lists exactly the photo and song it references", () => {
    const c = clone();
    expect(referencedAssets(c)).toEqual([]);
    c.finale.photo = { assetId: A };
    c.music.audio = { assetId: B };
    expect(referencedAssets(c)).toEqual([
      { id: A, kind: "image" },
      { id: B, kind: "audio" },
    ]);
  });
});

describe("do you love me — the No sequence", () => {
  const c = clone();
  const n = c.question.noMessages.length;

  it("starts with the plain No label, then walks the messages in order and stays on the last", () => {
    expect(noLabel(c, 0)).toBe("No");
    c.question.noMessages.forEach((m, i) => expect(noLabel(c, i + 1)).toBe(m));
    expect(noLabel(c, n + 5)).toBe(c.question.noMessages[n - 1]);
  });

  it("grows Yes monotonically from 0 to 1 and never beyond", () => {
    let last = -1;
    for (let k = 0; k <= n + 3; k++) {
      const g = growth(k, n);
      expect(g).toBeGreaterThanOrEqual(last);
      expect(g).toBeLessThanOrEqual(1);
      last = g;
    }
    expect(growth(0, n)).toBe(0);
    expect(growth(n, n)).toBe(1);
  });

  it("gets the buddy sadder as No is pressed", () => {
    expect(moodFor(0, n)).toBe("ask");
    expect(moodFor(1, n)).toBe("plead");
    expect(moodFor(n, n)).toBe("sad");
  });

  it("ships the suggested messages from the brief", () => {
    expect(SUGGESTED_NO_MESSAGES.slice(0, 4)).toEqual(["Are you sure?", "Really sure?", "Think again!", "Last chance!"]);
    expect(SUGGESTED_NO_MESSAGES.length).toBeLessThanOrEqual(MAX_NO_MESSAGES);
  });

  it("summarises the answer for the sender", () => {
    expect(answerSummary(0)).toBe("Said YES straight away ♡");
    expect(answerSummary(1)).toBe("Said YES after pressing “No” 1 time ♡");
    expect(answerSummary(7)).toBe("Said YES after pressing “No” 7 times ♡");
  });

  it("fills {partner} and {sender} and leaves other braces alone", () => {
    expect(fillTokens("Hey {partner}, love {sender} {x}", DEMO_CONTENT)).toBe("Hey Riya, love Aarav {x}");
  });
});

describe("do you love me — theme", () => {
  it("turns every preset into plain colour values", () => {
    for (const k of Object.keys(THEME_PRESETS) as (keyof typeof THEME_PRESETS)[]) {
      const t = presetTheme(k);
      expect(draftContentSchema.safeParse({ ...clone(), theme: t }).success).toBe(true);
      for (const v of Object.values(themeVars(t))) expect(v).toMatch(/^(#[0-9a-f]{6}|rgba\(\d+,\d+,\d+,[\d.]+\))$/);
    }
  });

  it("switches button text to dark on a very light custom button colour", () => {
    const t = { ...presetTheme("rose"), yes: "#f6f6c0" };
    expect(themeVars(t)["--dy-on-yes"]).not.toBe("#ffffff");
    expect(themeVars(presetTheme("rose"))["--dy-on-yes"]).toBe("#ffffff");
  });

  it("knows the midnight preset is dark", () => {
    expect(isDark(THEME_PRESETS.cherry.palette.card)).toBe(true);
    expect(isDark(THEME_PRESETS.rose.palette.card)).toBe(false);
  });
});

describe("do you love me — platform wiring", () => {
  it("is a registered template with its own public path and preview", () => {
    expect(isTemplateKey("doyouloveme")).toBe(true);
    const def = templateDef("doyouloveme");
    expect(def.path).toBe("ask");
    expect(def.previewPath("x")).toBe("/preview/ask/x");
    expect(def.parsePublish(DEMO_CONTENT).success).toBe(true);
    expect(def.recipientName(DEMO_CONTENT)).toBe("Riya");
    expect(def.refs({ ...clone(), finale: { ...clone().finale, photo: { assetId: A } } })).toEqual([{ id: A, kind: "image" }]);
  });

  it("seeds the database with exactly the code's defaults (no drift)", () => {
    const sql = fs.readFileSync("supabase/migrations/20261103000002_seed_doyouloveme_template.sql", "utf8");
    const json = JSON.stringify(draftContentSchema.parse(newSiteContent())).replace(/'/g, "''");
    expect(sql).toContain(`'${json}'::jsonb`);
    // New products ship hidden and free until an admin prices them — never an invented price.
    expect(sql).toMatch(/0, 'INR', \d+, \d+, false/);
  });
});
