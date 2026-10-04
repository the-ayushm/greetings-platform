import { z } from "zod";
import { setSiteStatus } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ action: z.enum(["disable", "enable", "extend"]), reason: z.string().min(3).max(200), days: z.number().int().min(1).max(365).optional() });

export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const { action, reason, days } = await readJson(req, body);
  return json(await setSiteStatus(admin.id, uuidParam((await params).siteId), action, reason, days));
});
