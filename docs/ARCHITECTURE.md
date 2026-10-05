# Architecture

## Surfaces

```
 www.example.in  (APP_ORIGIN)                     wishes.example.in  (RENDERER_ORIGIN)
 ├─ store: /, /product, /demo, /legal/*           └─ /birthday/<22-char slug>   recipient page
 ├─ /login (email code)                              /api/r/{unlock,media,view,report}
 ├─ /checkout → Razorpay Checkout                    no auth cookies · no-referrer · noindex
 ├─ /dashboard, /dashboard/sites/:id/edit            strict CSP · frame-ancestors 'none'
 ├─ /preview/:id (owner-only draft, iframe)
 ├─ /admin (role=admin + TOTP MFA)
 └─ /api/* (customer, webhooks, cron, admin)
                 │  server-only reads/writes             │
                 └──────────────┬───────────────────────┘
        Supabase: Postgres + RLS · Auth (email OTP, TOTP) · private Storage bucket "media"
                                ▲
                     Razorpay (orders API, signed webhooks)
```

One Next.js app serves both origins; `src/proxy.ts` routes by `Host`.

**Why two origins.** The birthday page renders text written by customers. Even though it is
rendered as text (never HTML), defence in depth says customer content must not share an origin
with sessions: auth cookies are host-only on the app origin and never reach the renderer. A
separate registrable domain is better still (see SECURITY.md).

**Why one app.** One deploy, one codebase, one set of types. Lint rules stop template code from
importing server or database modules.

## The birthday template

`src/templates/scrapbook/` is a port of `legacy/Your_Birthday_Surprise.html`:

- `scrapbook.css` — the legacy CSS **byte-for-byte** (verified by diff), plus an appended block
  of non-visual additions (dvh, `color-mix()` fallbacks for old WebViews, a11y helpers).
- `fonts/fonts.css` + `public/fonts/` — the exact Google Fonts files the legacy page loaded, self-hosted (OFL).
- `Experience.tsx` + `scenes/*` — same DOM structure, ids and class names; React state replaces
  `innerHTML` (so customer text is always escaped).
- `engine/` — router timers, confetti, pops and the music box, ported unchanged.
- `schema.ts` — Zod content schema (draft vs publish variants) replacing `birthdayConfig`.

Parity is enforced by tests, not by eye: 26 states × 4 viewports compared to the legacy
screenshots (max 0.1% pixel difference; actual max 0.016%) and 7 motion timelines compared at
100 ms resolution.

Render modes: `demo` (public sample), `preview` (owner's draft in the editor iframe, shows a
ribbon and "your photo" placeholders) and `live` (recipient; per-site browser storage key).

## Data flow

- **Customer reads** go through `userDb()` (publishable key + the user's session), so RLS filters
  every row.
- **Writes** go through route handlers → `src/server/*` → service-role client, always with an
  explicit owner filter after an RLS-scoped ownership read. Multi-row invariants live in
  database functions (`fulfil_order`, `publish_site`, `apply_refund`).
- **The renderer** resolves a slug server-side (service role) to the *published snapshot*, re-
  validates it with the schema, and signs URLs only for the assets that snapshot references.
  There is no public database policy on sites at all.

## Content lifecycle

`draft_content` (autosaved, optimistic concurrency via `draft_revision`) → **Publish** validates
with the strict schema and writes an immutable `site_versions` row → `sites.published_version_id`
points at it. Recipients only ever see published versions; editing never leaks half-done work.

## Media

Browser: HEIC→JPEG (libheif/WASM) and downscale → `POST /api/sites/:id/assets` → single-use signed
upload URL → direct upload to the private bucket (Vercel body limits avoided) →
`POST /api/assets/:id/complete` → server sniffs bytes, decodes with limits, re-encodes
(sharp drops EXIF/GPS) to WebP 480/1200 or validates/strips audio tags → original deleted.
Serving: signed URLs (2 h); the page refreshes them via `/api/r/media` if they expire mid-visit.
Storage paths are `<asset uuid>/<variant>` — no user or site ids in URLs.

## Payments

See CUSTOMER-FLOW.md. The webhook is the source of truth; the checkout callback is a fast path.
Both converge on the idempotent `fulfil_order` function. A reconcile cron recovers missed
webhooks and pending refunds.

## Performance

- Scenes are built on first visit (the original built all nine up front); hidden scenes are
  `display:none`, so this changes nothing visible but cuts first-load hydration to the cover.
- The five Latin font files are preloaded (HTTP `Link` header) from stable `/fonts/…` URLs with
  year-long immutable caching; other subsets load on demand via `unicode-range`.
- The landing page shows a still of the cover and loads the live demo only when tapped.
- Photos are 480/1200 px WebP served directly from storage (never through our functions).
- `node scripts/lighthouse.mjs` measures mobile (simulated slow 4G, 4× CPU). See
  RELEASE_CHECKLIST.md for the latest numbers and the budget.

## Observability

JSON-line logs (`src/server/log.ts`) with key-based redaction and masking of emails/phone
numbers in error text → Vercel logs / log drains. Business events also land in `audit_log`.
Error tracking (e.g. Sentry) is **not** wired in yet — see RELEASE_CHECKLIST.md.

## Known trade-offs

- `style-src 'unsafe-inline'` is required (React style attributes for the template's per-element
  CSS variables). Scripts are nonce-only.
- Admins can read customer content only via the audited "view content" action; the data API
  itself denies it (owner-only RLS on content tables).
- WebAudio is missing in Playwright's Windows WebKit, so iOS music-box playback is verified only
  for graceful fallback; real-device check is on the release checklist.
