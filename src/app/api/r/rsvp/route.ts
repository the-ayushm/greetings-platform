import { z } from "zod";
import { rendererCall } from "@/server/guards";
import { badRequest, clientIp, json, notFound, rateLimit, readJson, route } from "@/server/http";
import { recordRsvp } from "@/server/rsvps";
import { resolvePublicSite } from "@/server/sites";
import { isUnlocked } from "@/server/unlock";
import { rsvpInputSchema } from "@/templates/wedding/schema";

export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().max(64),
  reply: rsvpInputSchema,
  /** Honeypot: hidden from people, filled in by form-spamming bots. */
  website: z.string().max(200),
});

/** A guest's RSVP on a wedding invitation page. */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug, reply, website } = await readJson(req, body, 8 * 1024);
  if (website) throw badRequest("Your reply couldn't be sent.");
  await rateLimit("rsvp", `${clientIp(req)}|${slug}`, 10, 600);
  const site = await resolvePublicSite(slug, "wedding");
  if (!site || !(await isUnlocked(site))) throw notFound();
  return json(await recordRsvp(site, reply));
});
