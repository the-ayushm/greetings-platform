import { z } from "zod";
import { customerMutation, uuidParam } from "@/server/guards";
import { json, readJson, route } from "@/server/http";
import { setPasscode } from "@/server/sites";

export const dynamic = "force-dynamic";

const body = z.object({ passcode: z.string().regex(/^[0-9]{4,8}$/, "Use 4 to 8 digits.").nullable() });

export const PUT = route<{ siteId: string }>(async (req, { params }) => {
  const user = await customerMutation(req, { bucket: "site-ops", max: 60, windowSeconds: 600 });
  const { passcode } = await readJson(req, body);
  return json(await setPasscode(user.id, uuidParam((await params).siteId), passcode));
});
