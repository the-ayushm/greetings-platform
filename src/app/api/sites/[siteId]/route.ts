import { z } from "zod";
import { customerMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { deleteSite } from "@/server/sites";

export const dynamic = "force-dynamic";

export const DELETE = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 60, windowSeconds: 600 });
  await readJson(req, z.object({ confirm: z.literal("DELETE") }));
  return json(await deleteSite(user.id, uuidParam((await params).siteId)));
});
