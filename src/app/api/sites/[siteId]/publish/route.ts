import { customerMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { publishSite } from "@/server/sites";

export const dynamic = "force-dynamic";

export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "publish", max: 30, windowSeconds: 600 });
  return json(await publishSite(user.id, uuidParam((await params).siteId)));
});
