import { z } from "zod";
import { customerMutation } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { createCheckout } from "@/server/orders";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const user = await customerMutation(req, { bucket: "checkout", max: 15, windowSeconds: 600 });
  const { productId } = await readJson(req, z.object({ productId: z.uuid() }));
  return json(await createCheckout(user.id, productId));
});
