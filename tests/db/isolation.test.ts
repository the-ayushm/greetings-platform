import { beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createUser, enrollMfa, runId, seedPublishedSite, type TestUser } from "../helpers/db";

/**
 * Database-level tenant isolation. Customers A, B and C get real Supabase sessions and attack
 * each other straight through the public data API and storage (no app code in between).
 * Every unauthorised read must return nothing and every write must be refused.
 */

type Seed = Awaited<ReturnType<typeof seedPublishedSite>>;
let A: TestUser, B: TestUser, C: TestUser;
let a: Seed, b: Seed;

beforeAll(async () => {
  const id = runId();
  [A, B, C] = await Promise.all([createUser(`iso-a-${id}@example.com`), createUser(`iso-b-${id}@example.com`), createUser(`iso-c-${id}@example.com`)]);
  [a, b] = await Promise.all([seedPublishedSite(A.id), seedPublishedSite(B.id)]);
});

describe("reads: each customer sees only their own rows", () => {
  it.each(["sites", "orders", "assets", "payments", "site_versions", "profiles"] as const)("%s", async (table) => {
    for (const [me, mine] of [[A, a], [B, b], [C, null]] as const) {
      const { data, error } = await me.client.from(table).select("*");
      expect(error).toBeNull();
      const rows = data as Record<string, unknown>[];
      for (const row of rows) {
        const owner = (row.user_id ?? row.id) as string;
        if (table === "payments" || table === "site_versions") continue; // checked below via joins
        expect(owner).toBe(me.id);
      }
      if (table === "sites") expect(rows.map((r) => r.id)).toEqual(mine ? [mine.siteId] : []);
    }
  });

  it("B cannot read A's site, version, assets, order or payment by id", async () => {
    const db = B.client;
    expect((await db.from("sites").select("*").eq("id", a.siteId)).data).toEqual([]);
    expect((await db.from("site_versions").select("*").eq("site_id", a.siteId)).data).toEqual([]);
    expect((await db.from("assets").select("*").eq("id", a.assetId)).data).toEqual([]);
    expect((await db.from("orders").select("*").eq("id", a.orderId)).data).toEqual([]);
    expect((await db.from("payments").select("*").eq("order_id", a.orderId)).data).toEqual([]);
    expect((await db.from("sites").select("*").eq("slug", a.slug)).data).toEqual([]);
  });

  it("C (no purchases) sees nothing at all", async () => {
    for (const t of ["sites", "orders", "assets", "payments", "site_versions"] as const) {
      expect((await C.client.from(t).select("*")).data).toEqual([]);
    }
  });

  it("admin-only tables return nothing to customers", async () => {
    for (const t of ["payment_events", "audit_log", "abuse_reports", "template_versions"] as const) {
      expect((await A.client.from(t).select("*")).data).toEqual([]);
    }
  });

  it("anonymous visitors can read only the public catalog", async () => {
    const db = anon();
    expect((await db.from("products").select("id")).data?.length).toBeGreaterThan(0);
    for (const t of ["sites", "orders", "assets", "payments", "site_versions", "profiles", "audit_log", "payment_events", "rate_limits"] as const) {
      const r = await db.from(t).select("*");
      expect(r.data ?? []).toEqual([]);
      expect(r.error?.code === "42501" || (r.data ?? []).length === 0).toBe(true);
    }
  });
});

describe("writes: customers cannot write anything directly", () => {
  it("insert/update/delete are refused on every table", async () => {
    const db = B.client;
    const attempts = [
      db.from("sites").update({ status: "published" }).eq("id", b.siteId).select(),
      db.from("sites").update({ draft_content: {} }).eq("id", a.siteId).select(),
      db.from("sites").delete().eq("id", a.siteId).select(),
      db.from("orders").update({ status: "paid" }).eq("id", b.orderId).select(),
      db.from("orders").insert({ user_id: B.id, product_id: crypto.randomUUID(), template_key: "scrapbook", template_version: 1, amount_paise: 1, currency: "INR", edit_days: 1, live_days: 1, receipt: "x" }).select(),
      db.from("profiles").update({ role: "admin" }).eq("id", B.id).select(),
      db.from("assets").insert({ site_id: a.siteId, user_id: B.id, kind: "image", declared_mime: "image/jpeg", declared_bytes: 1, storage_prefix: "x" }).select(),
      db.from("products").update({ price_paise: 100 }).neq("id", "00000000-0000-0000-0000-000000000000").select(),
      db.from("site_versions").insert({ site_id: a.siteId, version: 99, content: {}, schema_version: 1 }).select(),
      db.from("audit_log").delete().gt("id", 0).select(),
    ];
    for (const r of await Promise.all(attempts)) {
      expect(r.error, JSON.stringify(r.data)).not.toBeNull();
      expect(r.error!.code).toBe("42501");
    }
    const { data: me } = await admin().from("profiles").select("role").eq("id", B.id).single();
    expect(me!.role).toBe("customer");
  });

  it("privileged database functions cannot be called by customers or anonymous users", async () => {
    for (const db of [B.client, anon()]) {
      const calls = [
        db.rpc("fulfil_order", { p_razorpay_order_id: b.rzpOrder, p_payment_id: "pay_x", p_amount: 1, p_currency: "INR", p_method: "x" }),
        db.rpc("publish_site", { p_site_id: a.siteId, p_user_id: A.id, p_content: {}, p_schema_version: 1, p_new_slug: "x" }),
        db.rpc("apply_refund", { p_payment_id: "pay_x", p_refund_id: "r", p_amount: 1, p_status: "processed" }),
        db.rpc("record_view", { p_site_id: a.siteId }),
        db.rpc("rate_limit_hit", { p_key: "x", p_window_seconds: 60, p_max: 1 }),
      ];
      for (const r of await Promise.all(calls)) expect(r.error?.code).toBe("42501");
    }
  });
});

describe("storage: private bucket, no direct access", () => {
  it("files can't be listed, read, overwritten or deleted by other customers or anonymous users", async () => {
    for (const db of [B.client, C.client, anon()]) {
      const store = db.storage.from("media");
      const dl = await store.download(`${a.assetId}/w480.webp`);
      expect(dl.data).toBeNull();
      const list = await store.list(a.assetId);
      expect(list.data ?? []).toEqual([]);
      const up = await store.upload(`${a.assetId}/w480.webp`, new Blob(["x"]), { upsert: true, contentType: "image/webp" });
      expect(up.error).not.toBeNull();
      const up2 = await store.upload(`attacker/${runId()}.webp`, new Blob(["x"]), { contentType: "image/webp" });
      expect(up2.error).not.toBeNull();
      const rm = await store.remove([`${a.assetId}/w480.webp`]);
      expect(rm.data ?? []).toEqual([]);
      const signed = await store.createSignedUrl(`${a.assetId}/w480.webp`, 60);
      expect(signed.data).toBeNull();
    }
    // Owner A can't use the raw storage API either — files are only served via server-minted URLs.
    const own = await A.client.storage.from("media").download(`${a.assetId}/w480.webp`);
    expect(own.data).toBeNull();
    // …and the object is still intact.
    const ok = await admin().storage.from("media").download(`${a.assetId}/w480.webp`);
    expect(ok.data).not.toBeNull();
  });

  it("the bucket is private", async () => {
    const { data } = await admin().storage.getBucket("media");
    expect(data?.public).toBe(false);
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${a.assetId}/w480.webp`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("admin access requires role AND MFA, and never exposes customer content", () => {
  it("admin role without MFA (aal1) gets nothing extra", async () => {
    await admin().from("profiles").update({ role: "admin" }).eq("id", C.id);
    const { data } = await C.client.from("payment_events").select("*");
    expect(data).toEqual([]);
    expect((await C.client.from("orders").select("*")).data).toEqual([]);
  });

  it("admin + MFA (aal2) can read operational tables but still not customer content", async () => {
    await enrollMfa(C);
    const orders = (await C.client.from("orders").select("id")).data ?? [];
    expect(orders.map((o) => o.id)).toEqual(expect.arrayContaining([a.orderId, b.orderId]));
    expect((await C.client.from("sites").select("*").eq("id", a.siteId)).data).toEqual([]);
    expect((await C.client.from("site_versions").select("*").eq("site_id", a.siteId)).data).toEqual([]);
    expect((await C.client.from("assets").select("*").eq("id", a.assetId)).data).toEqual([]);
    // Still no direct writes.
    const w = await C.client.from("orders").update({ status: "refunded" }).eq("id", a.orderId).select();
    expect(w.error?.code).toBe("42501");
  });
});

describe("integrity guards in the database", () => {
  it("an asset can't be attached to someone else's site, even by a buggy server", async () => {
    const r = await admin().from("assets").insert({ site_id: a.siteId, user_id: B.id, kind: "image", declared_mime: "image/jpeg", declared_bytes: 1, storage_prefix: "x" });
    expect(r.error?.code).toBe("42501");
  });

  it("publish_site refuses a site that isn't the caller's", async () => {
    const { data } = await admin().rpc("publish_site", { p_site_id: a.siteId, p_user_id: B.id, p_content: {}, p_schema_version: 1, p_new_slug: "x" });
    expect((data as { status: string }).status).toBe("not_found");
  });

  it("fulfil_order is idempotent and records a second payment as a duplicate", async () => {
    const db = admin();
    const { data: pays } = await db.from("payments").select("razorpay_payment_id").eq("order_id", a.orderId);
    const again = await db.rpc("fulfil_order", { p_razorpay_order_id: a.rzpOrder, p_payment_id: pays![0]!.razorpay_payment_id, p_amount: 49900, p_currency: "INR", p_method: "upi" });
    expect((again.data as { status: string }).status).toBe("already");
    const dup = await db.rpc("fulfil_order", { p_razorpay_order_id: a.rzpOrder, p_payment_id: `pay_dup${runId()}`, p_amount: 49900, p_currency: "INR", p_method: "upi" });
    expect((dup.data as { status: string }).status).toBe("duplicate");
    const { count } = await db.from("sites").select("id", { count: "exact", head: true }).eq("order_id", a.orderId);
    expect(count).toBe(1);
  });

  it("fulfil_order rejects an amount that doesn't match the order", async () => {
    const db = admin();
    const { data: product } = await db.from("products").select("*").limit(1).single();
    const rz = `order_mm${runId()}${runId()}`;
    await db.from("orders").insert({ user_id: B.id, product_id: product!.id, template_key: "scrapbook", template_version: 1, amount_paise: product!.price_paise, currency: "INR", edit_days: 30, live_days: 365, receipt: `rcpt_mm${runId()}`, razorpay_order_id: rz });
    const r = await db.rpc("fulfil_order", { p_razorpay_order_id: rz, p_payment_id: `pay_mm${runId()}`, p_amount: 100, p_currency: "INR", p_method: "upi" });
    expect((r.data as { status: string }).status).toBe("amount_mismatch");
    const { data: o } = await db.from("orders").select("status").eq("razorpay_order_id", rz).single();
    expect(o!.status).toBe("created");
  });
});
