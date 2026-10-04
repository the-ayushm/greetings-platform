import { z } from "zod";
import { requireUser } from "@/server/auth";
import { customerMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { createUpload, listSiteAssets } from "@/server/media";

export const dynamic = "force-dynamic";

export const GET = route<{ siteId: string }>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ assets: await listSiteAssets(user.id, uuidParam((await params).siteId)) });
});

const body = z.object({
  kind: z.enum(["image", "audio"]),
  mime: z.string().max(80),
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
  filename: z.string().max(400),
  rightsConfirmed: z.boolean().optional(),
});

/** Step 1 of an upload: validate, create a pending asset, hand back a single-use signed upload URL. */
export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "upload", max: 80, windowSeconds: 3600 });
  return json(await createUpload(user.id, uuidParam((await params).siteId), await readJson(req, body)));
});
