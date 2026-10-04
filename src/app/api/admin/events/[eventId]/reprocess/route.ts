import { adminAudit } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, route } from "@/server/http";
import { reprocessEvent } from "@/server/orders";

export const dynamic = "force-dynamic";

export const POST = route<{ eventId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const id = uuidParam((await params).eventId);
  const r = await reprocessEvent(id);
  await adminAudit(admin.id, "admin.event.reprocess", "payment_event", id, r);
  return json(r);
});
