import { z } from "zod";
import { updateLoveDefaults } from "@/server/admin";
import { adminMutation } from "@/server/guards";
import { json, notFound, readJson, route } from "@/server/http";
import { SECTION_IDS } from "@/templates/lovestory/schema";

export const dynamic = "force-dynamic";

const body = z.object({
  sections: z.array(z.object({ id: z.enum(SECTION_IDS), enabled: z.boolean() })).length(SECTION_IDS.length).optional(),
  preset: z.enum(["cherry", "pink", "midnight", "vintage", "pastel"]).optional(),
});

/** Admin: defaults (sections on/off, starting theme) for new love story orders. Audited. */
export const PATCH = route<{ key: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  if ((await params).key !== "lovestory") throw notFound();
  return json(await updateLoveDefaults(admin.id, await readJson(req, body)));
});
