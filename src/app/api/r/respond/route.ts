import { z } from "zod";
import { rendererCall } from "@/server/guards";
import { clientIp, json, notFound, rateLimit, readJson, route } from "@/server/http";
import { recordResponse } from "@/server/responses";
import { resolvePublicSite } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";

export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().max(64),
  kind: z.enum(["text", "slider", "coupon", "answer"]),
  itemId: z.string().regex(/^[a-z0-9]{4,16}$/),
  value: z.string().max(4000),
});

/**
 * A recipient's answer on a love story page, or the "Yes" on a "Do You Love Me?" page (stored
 * only if the creator switched it on; recordResponse checks the kind against the template).
 */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug, kind, itemId, value } = await readJson(req, body, 8 * 1024);
  await rateLimit("respond", `${clientIp(req)}|${slug}`, 20, 600);
  const site = await resolvePublicSite(slug);
  if (!site || (site.templateKey !== "lovestory" && site.templateKey !== "doyouloveme") || !(await isUnlocked(site))) throw notFound();
  return json(await recordResponse(site, kind, itemId, value));
});
