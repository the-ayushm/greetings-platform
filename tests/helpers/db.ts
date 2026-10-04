import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_CONTENT } from "@/templates/scrapbook/defaults";
import type { Database } from "@/lib/supabase/database.types";

export const URL_ = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const admin = () => createClient<Database>(URL_(), process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
export const anon = () => createClient<Database>(URL_(), process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

export const runId = () => crypto.randomBytes(4).toString("hex");

export type TestUser = { id: string; email: string; password: string; client: SupabaseClient<Database> };

/** Real Supabase user + a client signed in as them (publishable key + their JWT). */
export async function createUser(email: string): Promise<TestUser> {
  const password = crypto.randomBytes(18).toString("base64url");
  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = anon();
  const { error: e2 } = await client.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  return { id: data.user.id, email, password, client };
}

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for driving MFA in tests. */
export function totp(secretBase32: string, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secretBase32.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const h = crypto.createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1]! & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** Upgrade a signed-in client to an aal2 (MFA) session. */
export async function enrollMfa(u: TestUser) {
  const { data, error } = await u.client.auth.mfa.enroll({ factorType: "totp" });
  if (error) throw error;
  const { error: e2 } = await u.client.auth.mfa.challengeAndVerify({ factorId: data.id, code: totp(data.totp.secret) });
  if (e2) throw e2;
  return data.totp.secret;
}

/**
 * Seeds a paid order + published site + one private file for a user, using the same
 * database functions the app uses (fulfil_order / publish_site).
 */
export async function seedPublishedSite(userId: string) {
  const db = admin();
  const { data: product } = await db.from("products").select("*").eq("is_active", true).limit(1).single();
  const rzpOrder = `order_${runId()}${runId()}`;
  const { data: order, error } = await db
    .from("orders")
    .insert({ user_id: userId, product_id: product!.id, template_key: "scrapbook", template_version: 1, amount_paise: product!.price_paise, currency: "INR", edit_days: 30, live_days: 365, receipt: `rcpt_${runId()}${runId()}`, razorpay_order_id: rzpOrder })
    .select("id")
    .single();
  if (error) throw error;
  const { data: ful } = await db.rpc("fulfil_order", { p_razorpay_order_id: rzpOrder, p_payment_id: `pay_${runId()}${runId()}`, p_amount: product!.price_paise, p_currency: "INR", p_method: "upi" });
  const siteId = (ful as { site_id: string }).site_id;
  const assetId = crypto.randomUUID();
  await db.from("assets").insert({ id: assetId, site_id: siteId, user_id: userId, kind: "image", status: "ready", declared_mime: "image/webp", declared_bytes: 10, storage_prefix: assetId, variants: { w480: `${assetId}/w480.webp`, w1200: `${assetId}/w1200.webp` } });
  const png = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=", "base64");
  await db.storage.from("media").upload(`${assetId}/w480.webp`, png, { contentType: "image/webp" });
  await db.storage.from("media").upload(`${assetId}/w1200.webp`, png, { contentType: "image/webp" });
  const content = structuredClone(DEMO_CONTENT);
  content.recipientName = `Secret-${userId.slice(0, 6)}`;
  content.cover.photo = { assetId };
  const slug = crypto.randomBytes(32).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
  const { data: pub } = await db.rpc("publish_site", { p_site_id: siteId, p_user_id: userId, p_content: content as never, p_schema_version: 1, p_new_slug: slug });
  return { orderId: order!.id, siteId, assetId, slug: (pub as { slug: string }).slug, rzpOrder };
}
