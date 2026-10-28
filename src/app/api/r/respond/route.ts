import { z } from "zod";
import { rendererCall } from "@/server/guards";
import { clientIp, json, notFound, rateLimit, readJson, route } from "@/server/http";
import { recordResponse } from "@/server/responses";
import { resolvePublicSite } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";

export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().max(64),
  kind: z.enum(["text", "slider", "coupon"]),
  itemId: z.string().regex(/^[a-z0-9]{4,16}$/),
  value: z.string().max(4000),
});

/** A recipient's answer on a love story page (stored only if the creator switched collection on). */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug, kind, itemId, value } = await readJson(req, body, 8 * 1024);
  await rateLimit("respond", `${clientIp(req)}|${slug}`, 20, 600);
  const site = await resolvePublicSite(slug, "lovestory");
  if (!site || !(await isUnlocked(site))) throw notFound();
  return json(await recordResponse(site, kind, itemId, value));
});
