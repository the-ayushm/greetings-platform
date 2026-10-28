import { z } from "zod";
import { canSeeUnlisted } from "@/server/auth";
import { customerMutation } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { createCheckout } from "@/server/orders";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const user = await customerMutation(req, { bucket: "checkout", max: 15, windowSeconds: 600 });
  const { productId } = await readJson(req, z.object({ productId: z.uuid() }));
  // Products that aren't on sale yet can only be acquired by MFA'd admins (testing).
  return json(await createCheckout(user.id, productId, await canSeeUnlisted(user)));
});
