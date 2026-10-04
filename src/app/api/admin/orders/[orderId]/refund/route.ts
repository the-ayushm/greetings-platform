import { z } from "zod";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { refundOrder } from "@/server/orders";

export const dynamic = "force-dynamic";

export const POST = route<{ orderId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  const { reason } = await readJson(req, z.object({ reason: z.string().min(3).max(200) }));
  return json(await refundOrder(uuidParam((await params).orderId), admin.id, reason));
});
