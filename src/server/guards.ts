import "server-only";
import { requireAdmin, requireUser } from "./auth";
import { appOrigins, rendererOrigins } from "./env";
import { badRequest, isUuid, rateLimit, requireOrigin } from "./http";

/** Signed-in customer making a state-changing call from our own app origin. */
export async function customerMutation(req: Request, limit?: { bucket: string; max: number; windowSeconds: number }) {
  requireOrigin(req, appOrigins());
  const user = await requireUser();
  if (limit) await rateLimit(limit.bucket, user.id, limit.max, limit.windowSeconds);
  return user;
}

export async function adminMutation(req: Request) {
  requireOrigin(req, appOrigins());
  const admin = await requireAdmin();
  await rateLimit("admin", admin.id, 120, 60);
  return admin;
}

export function rendererCall(req: Request) {
  requireOrigin(req, rendererOrigins());
}

export function uuidParam(v: string) {
  if (!isUuid(v)) throw badRequest("Invalid id.");
  return v;
}
