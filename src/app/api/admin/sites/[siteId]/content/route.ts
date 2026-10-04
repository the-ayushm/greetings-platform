import { z } from "zod";
import { viewSiteContent } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

/** Deliberate, audited access to a customer's content (e.g. investigating a report). */
export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const { reason } = await readJson(req, z.object({ reason: z.string().min(5).max(200) }));
  return json(await viewSiteContent(admin.id, uuidParam((await params).siteId), reason));
});
