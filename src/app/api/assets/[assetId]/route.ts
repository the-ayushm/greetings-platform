import { customerMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { deleteAsset } from "@/server/media";

export const dynamic = "force-dynamic";

export const DELETE = route<{ assetId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 120, windowSeconds: 600 });
  return json(await deleteAsset(user.id, uuidParam((await params).assetId)));
});
