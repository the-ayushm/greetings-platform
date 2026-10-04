import { customerMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { rotateLink } from "@/server/sites";

export const dynamic = "force-dynamic";

export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 60, windowSeconds: 600 });
  return json(await rotateLink(user.id, uuidParam((await params).siteId)));
});
