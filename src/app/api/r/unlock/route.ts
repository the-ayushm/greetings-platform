import { z } from "zod";
import { verifyPasscode } from "@/server/crypto";
import { rendererCall } from "@/server/guards";
import { ApiError, clientIp, json, rateLimit, readJson, route } from "@/server/http";
import { resolvePublicSite } from "@/server/sites";
import { grantUnlock } from "@/server/unlock";

export const dynamic = "force-dynamic";

const body = z.object({ slug: z.string().max(64), passcode: z.string().max(16) });

export const POST = route(async (req) => {
  rendererCall(req);
  const { slug, passcode } = await readJson(req, body, 2048);
  const ip = clientIp(req);
  await rateLimit("unlock-ip-slug", `${ip}|${slug}`, 6, 900);
  await rateLimit("unlock-slug", slug, 40, 3600);
  const site = await resolvePublicSite(slug);
  // Same answer for unknown links and wrong codes.
  if (!site?.passcodeHash || !/^[0-9]{4,8}$/.test(passcode) || !verifyPasscode(passcode, site.passcodeHash)) {
    throw new ApiError(403, "wrong_passcode", "That code isn't right.");
  }
  await grantUnlock(site);
  return json({ ok: true });
});
