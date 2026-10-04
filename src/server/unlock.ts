import "server-only";
import { cookies } from "next/headers";
import { keyedHash, readToken, signToken } from "./crypto";
import { rendererOrigin } from "./env";
import type { PublicSite } from "./sites";

const TTL = 12 * 60 * 60;
const cookieName = (siteId: string) => `u_${keyedHash(`unlock:${siteId}`).slice(0, 12)}`;

/** True if the site has no passcode, or this browser unlocked the current passcode version. */
export async function isUnlocked(site: PublicSite): Promise<boolean> {
  if (!site.passcodeHash) return true;
  const store = await cookies();
  const t = readToken<{ s: string; v: number }>(store.get(cookieName(site.id))?.value);
  return Boolean(t && t.s === site.id && t.v === site.passcodeVersion);
}

/** HttpOnly, SameSite=Strict cookie on the renderer origin only; changing the passcode or the link invalidates it. */
export async function grantUnlock(site: PublicSite) {
  const store = await cookies();
  store.set(cookieName(site.id), signToken({ s: site.id, v: site.passcodeVersion }, TTL), {
    httpOnly: true,
    secure: rendererOrigin().startsWith("https://"),
    sameSite: "strict",
    path: "/",
    maxAge: TTL,
  });
}
