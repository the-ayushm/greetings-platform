# Customer flow

1. **Landing (`/`) → Demo (`/demo`) → Pricing (`/product`).** Price is read from the database.
2. **Buy now → `/checkout`.** Not signed in → `/login?next=/checkout…`.
3. **Sign in** with email → 6-digit code (Supabase Auth email OTP, 15-minute expiry). The account
   is created on first sign-in. Then back to checkout.
4. **Pay.** `POST /api/checkout` creates (or reuses, within 30 minutes) an order with the database
   price and a Razorpay order; Razorpay Checkout opens (UPI, cards, netbanking, wallets).
   - Success → `POST /api/checkout/verify` (signature + payment re-fetched from Razorpay).
   - Razorpay also sends `order.paid` to `/api/webhooks/razorpay` — the source of truth.
   - Either path calls `fulfil_order` once: the order becomes `paid` and a **draft site** is
     created (editable 30 days, live 1 year).
   - Failure → the customer sees why and can retry on the same order. A second successful payment
     for the same order is refunded automatically.
5. **Order page** (`/dashboard/orders/:id`) polls until the site exists → "Start personalising".
6. **Editor** (`/dashboard/sites/:id/edit`): names, cover, questions, letter, memories (≤ 12
   photos), coupons, song (MP3/M4A/AAC ≤ 12 MB / 8 min with a rights confirmation, or the built-in
   music box), cupcake, final page, colours, optional wording. Autosaves every change; a live
   preview iframe runs the real template on the draft.
7. **Publish** validates required fields, snapshots the content and gives the private URL:
   `https://wishes.example.in/birthday/<22 random chars>`.
8. **Share** (`/dashboard/sites/:id`): copy link, WhatsApp, QR code (download), optional passcode.
9. **Recipient** opens the link — no account. The customer's dashboard shows when it was first
   opened and how many times.
10. **Edit again** any time in the 30-day window → Publish → same link shows the new version.
11. **Make a new link** (old one dies instantly), **Unpublish**, or **Delete** (content and files
    removed immediately; the order record stays for accounting).
12. **Account**: download all data as JSON, or delete the account entirely.

## What can go wrong (and what happens)

| Situation | Behaviour |
|---|---|
| Browser closed during payment | Webhook still fulfils; reconcile cron (every 10 min) catches missed webhooks |
| Webhook delivered twice | Stored once per event id; second delivery answered `duplicate_event` |
| Paid twice for one order | Second payment auto-refunded; one site |
| Refund (admin) | Order `refund_pending` → `refunded` on Razorpay's webhook; site disabled, link 404 |
| Editing in two tabs | Second save gets "edited in another tab — reload" (optimistic concurrency) |
| Photo URL expired on an open page | Page fetches fresh signed URLs once and retries |
| Edit window over | Site stays live; editor locked (admin can extend) |
| Site past 1 year | Link off (`expired`); content and files purged 30 days later |
