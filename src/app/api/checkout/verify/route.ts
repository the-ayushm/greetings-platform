import { z } from "zod";
import { customerMutation } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { verifyCheckout } from "@/server/orders";

export const dynamic = "force-dynamic";

const body = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export const POST = route(async (req) => {
  const user = await customerMutation(req, { bucket: "verify", max: 30, windowSeconds: 600 });
  return json(await verifyCheckout(user.id, await readJson(req, body)));
});
