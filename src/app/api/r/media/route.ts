import { z } from "zod";
import { rendererCall } from "@/server/guards";
import { clientIp, json, notFound, rateLimit, readJson, route } from "@/server/http";
import { resolvePublicSite, signMedia } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";

export const dynamic = "force-dynamic";

/** Fresh signed URLs for a page that has been open longer than the URL lifetime. */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug } = await readJson(req, z.object({ slug: z.string().max(64) }), 1024);
  await rateLimit("media-refresh", clientIp(req), 30, 600);
  const site = await resolvePublicSite(slug);
  if (!site || !(await isUnlocked(site))) throw notFound();
  return json(await signMedia(site.id, site.content));
});
