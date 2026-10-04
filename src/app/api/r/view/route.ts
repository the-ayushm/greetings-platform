import { z } from "zod";
import { rendererCall } from "@/server/guards";
import { ApiError, clientIp, json, rateLimit, readJson, route } from "@/server/http";
import { recordView, resolvePublicSite } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";

export const dynamic = "force-dynamic";

/** Sent by the page after it has been open a few seconds, so link-preview bots aren't counted. */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug } = await readJson(req, z.object({ slug: z.string().max(64) }), 1024);
  try {
    await rateLimit("view", `${clientIp(req)}|${slug}`, 1, 1800);
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return json({ ok: true });
    throw e;
  }
  const site = await resolvePublicSite(slug);
  if (site && (await isUnlocked(site))) await recordView(site.id);
  return json({ ok: true });
});
