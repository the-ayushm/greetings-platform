import { z } from "zod";
import { draftContentSchema } from "@/templates/scrapbook/schema";
import { customerMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { saveDraft } from "@/server/sites";

export const dynamic = "force-dynamic";

const body = z.object({ content: draftContentSchema, revision: z.number().int().positive() });

/** Autosave. Optimistic concurrency: the save only applies on top of the revision the editor loaded. */
export const PUT = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "draft", max: 240, windowSeconds: 600 });
  const siteId = uuidParam((await params).siteId);
  const { content, revision } = await readJson(req, body, 300 * 1024);
  return json(await saveDraft(user.id, siteId, content, revision));
});
