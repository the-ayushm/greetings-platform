import { z } from "zod";
import { resolveReport } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ status: z.enum(["actioned", "dismissed"]), note: z.string().max(500).default(""), disableSite: z.boolean().default(false) });

export const POST = route<{ reportId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const { status, note, disableSite } = await readJson(req, body);
  return json(await resolveReport(admin.id, uuidParam((await params).reportId), status, note, disableSite));
});
