import { z } from "zod";
import { userDb } from "@/lib/supabase/server";
import { deleteAccount } from "@/server/account";
import { customerMutation } from "@/server/guards";
import { json, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const DELETE = route(async (req) => {
  const user = await customerMutation(req, { bucket: "account-delete", max: 5, windowSeconds: 3600 });
  await readJson(req, z.object({ confirm: z.literal("DELETE MY ACCOUNT") }));
  await deleteAccount(user.id);
  await (await userDb()).auth.signOut();
  return json({ deleted: true });
});
