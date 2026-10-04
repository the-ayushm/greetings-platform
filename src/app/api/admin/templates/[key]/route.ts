import { z } from "zod";
import { updateTemplate } from "@/server/admin";
import { adminMutation } from "@/server/guards";
import { badRequest, json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const PATCH = route<{ key: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const { key } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(key)) throw badRequest("Invalid template.");
  const { isActive } = await readJson(req, z.object({ isActive: z.boolean() }));
  return json(await updateTemplate(admin.id, key, isActive));
});
