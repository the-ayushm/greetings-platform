import { z } from "zod";
import { customerMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { deleteResponses } from "@/server/responses";

export const dynamic = "force-dynamic";

/** Owner deletes one recipient response ({ id }) or all of them ({ id: null }). */
export const DELETE = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 120, windowSeconds: 600 });
  const { id } = await readJson(req, z.object({ id: z.uuid().nullable() }));
  return json(await deleteResponses(user.id, uuidParam((await params).siteId), id));
});
