import { newSiteContent as newScrapbook } from "./scrapbook/defaults";
import * as scrapbook from "./scrapbook/schema";
import { newSiteContent as newLoveStory } from "./lovestory/defaults";
import * as lovestory from "./lovestory/schema";
import { newSiteContent as newWedding } from "./wedding/defaults";
import * as wedding from "./wedding/schema";

/**
 * Every sellable template, keyed by `templates.key` / `sites.template_key`. Server code (drafts,
 * publishing, media checks, signed URLs) looks the template up here instead of importing one
 * directly. Each renderer route still imports only its own template, so their CSS never mixes.
 */

export type AssetRef = { id: string; kind: "image" | "audio" };
export type Issue = { path: string; message: string };
type Parsed = { success: true; data: object } | { success: false; issues: Issue[] };

export type TemplateDef = {
  key: TemplateKey;
  schemaVersion: number;
  /** Recipient URL path prefix on the renderer origin. */
  path: "birthday" | "love" | "wedding";
  /** Preview route (app origin) used by the editor iframe. */
  previewPath: (siteId: string) => string;
  /** Live (pending + ready) files a single site may hold. */
  limits: { image: number; audio: number };
  parseDraft: (v: unknown) => Parsed;
  parsePublish: (v: unknown) => Parsed;
  /** Only call with content that already passed parseDraft/parsePublish. */
  refs: (content: object) => AssetRef[];
  newContent: () => object;
  /** Best-effort recipient name from a stored draft (dashboard titles). */
  recipientName: (draft: unknown) => string;
  shareText: string;
};

function wrap<T extends object>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }) {
  return (v: unknown): Parsed => {
    const r = schema.safeParse(v);
    if (r.success) return { success: true, data: r.data };
    return { success: false, issues: r.error.issues.slice(0, 20).map((i) => ({ path: i.path.map(String).join("."), message: i.message })) };
  };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const TEMPLATES = {
  scrapbook: {
    key: "scrapbook",
    schemaVersion: scrapbook.SCHEMA_VERSION,
    path: "birthday",
    previewPath: (id: string) => `/preview/${id}`,
    limits: { image: 40, audio: 3 },
    parseDraft: wrap(scrapbook.draftContentSchema),
    parsePublish: wrap(scrapbook.publishContentSchema),
    refs: (c: object) => scrapbook.referencedAssets(c as scrapbook.ScrapbookContent),
    newContent: newScrapbook,
    recipientName: (d: unknown) => str((d as { recipientName?: unknown } | null)?.recipientName),
    shareText: "A little birthday surprise, just for you ♡",
  },
  lovestory: {
    key: "lovestory",
    schemaVersion: lovestory.SCHEMA_VERSION,
    path: "love",
    previewPath: (id: string) => `/preview/love/${id}`,
    limits: { image: 80, audio: 3 },
    parseDraft: wrap(lovestory.draftContentSchema),
    parsePublish: wrap(lovestory.publishContentSchema),
    refs: (c: object) => lovestory.referencedAssets(c as lovestory.LoveContent),
    newContent: newLoveStory,
    recipientName: (d: unknown) => str((d as { people?: { partnerName?: unknown } } | null)?.people?.partnerName),
    shareText: "I made a little world, just for us ♡",
  },
  wedding: {
    key: "wedding",
    schemaVersion: wedding.SCHEMA_VERSION,
    path: "wedding",
    previewPath: (id: string) => `/preview/wedding/${id}`,
    limits: { image: 20, audio: 3 },
    parseDraft: wrap(wedding.draftContentSchema),
    parsePublish: wrap(wedding.publishContentSchema),
    refs: (c: object) => wedding.referencedAssets(c as wedding.WeddingContent),
    newContent: newWedding,
    recipientName: (d: unknown) => {
      const c = (d as { couple?: { brideName?: unknown; groomName?: unknown } } | null)?.couple;
      return [str(c?.brideName), str(c?.groomName)].filter(Boolean).join(" & ");
    },
    shareText: "You're invited to our wedding ♡",
  },
} satisfies Record<string, TemplateDef & { key: string }>;

export type TemplateKey = "scrapbook" | "lovestory" | "wedding";

export function isTemplateKey(k: string): k is TemplateKey {
  return Object.hasOwn(TEMPLATES, k);
}

/** Unknown keys are a server bug (the DB only holds keys from migrations): fail loudly. */
export function templateDef(key: string): TemplateDef {
  if (!isTemplateKey(key)) throw new Error(`unknown template ${key}`);
  return TEMPLATES[key] as TemplateDef;
}
