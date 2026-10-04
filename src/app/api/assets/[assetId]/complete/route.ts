import { customerMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { completeUpload } from "@/server/media";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Step 2: verify bytes, strip metadata, make variants, then mark the asset ready. */
export const POST = route<{ assetId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "upload-complete", max: 80, windowSeconds: 3600 });
  return json(await completeUpload(user.id, uuidParam((await params).assetId)));
});
