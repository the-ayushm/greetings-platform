import { customerMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { unpublishSite } from "@/server/sites";

export const dynamic = "force-dynamic";

export const POST = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 60, windowSeconds: 600 });
  return json(await unpublishSite(user.id, uuidParam((await params).siteId)));
});
