import { z } from "zod";
import { adminDb } from "@/lib/supabase/admin";
import { keyedHash } from "@/server/crypto";
import { rendererCall } from "@/server/guards";
import { clientIp, json, rateLimit, readJson, route } from "@/server/http";
import { cleanText } from "@/templates/scrapbook/schema";

export const dynamic = "force-dynamic";

const body = z.object({
  slug: z.string().max(64),
  reason: z.enum(["harassment", "explicit", "copyright", "impersonation", "other"]),
  details: z.string().max(1000).default(""),
});

/** Abuse / copyright report from a birthday page. Answers the same way whether or not the link exists. */
export const POST = route(async (req) => {
  rendererCall(req);
  const { slug, reason, details } = await readJson(req, body, 4096);
  const ip = clientIp(req);
  await rateLimit("report", ip, 5, 3600);
  const site = /^[A-Za-z0-9]{22}$/.test(slug) ? (await adminDb().from("sites").select("id").eq("slug", slug).maybeSingle()).data : null;
  if (site) {
    await adminDb()
      .from("abuse_reports")
      .insert({ site_id: site.id, reason, details: cleanText(details, true).slice(0, 1000), reporter_hash: keyedHash(`ip:${ip}`) });
  }
  return json({ ok: true });
});
