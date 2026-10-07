import { z } from "zod";
import { updateProduct } from "@/server/admin";
import { adminMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({
  pricePaise: z.number().int().min(100).max(10_000_000).optional(),
  isActive: z.boolean().optional(),
  editDays: z.number().int().min(1).max(3650).optional(),
  liveDays: z.number().int().min(1).max(3650).optional(),
});

export const PATCH = route<{ productId: string }>(async (req, { params }) => {
  const admin = await adminMutation(req);
  return json(await updateProduct(admin.id, uuidParam((await params).productId), await readJson(req, body)));
});
