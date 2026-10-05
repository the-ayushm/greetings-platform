# Security & privacy

## Assets we protect

Customer content (names, letters, photos, songs), the private links, customer accounts,
payment integrity, and admin power.

## Customer isolation (A must never reach B)

| Layer | Control | Tested by |
|---|---|---|
| Database | Deny-by-default grants; `authenticated` has **SELECT only**, on own rows via RLS. No insert/update/delete grants for any API role. Content tables (`sites`, `site_versions`, `assets`) are owner-only — even admins can't read them through the API. | `tests/db/isolation.test.ts` (customers A/B/C, 20 tests) |
| Database functions | `fulfil_order`, `publish_site`, `apply_refund`, `record_view`, `rate_limit_hit` executable by `service_role` only; `publish_site` re-checks owner + edit window; trigger forbids attaching an asset to another owner's site. | same |
| Storage | One private bucket, **no** client policies. Only server-minted signed URLs (2 h) for exactly the assets a published snapshot references. Bucket size/type limits. | same + `uploads.spec.ts` |
| App | Every customer route: same-origin check → session → RLS-scoped ownership read → owner-filtered write. Missing and not-yours are both 404. Content referencing another site's asset id is rejected. | `tests/e2e/isolation.spec.ts` (A/B/C, every route + pages) |
| Next.js | Every admin/customer **page** checks auth itself (layouts aren't re-run on client navigation). | `admin.spec.ts`, `isolation.spec.ts` |

## Links

- Slug: 22 base62 chars from `crypto.randomBytes` with rejection sampling (~131 bits).
- Unknown, rotated, unpublished, disabled, refunded and expired links render the *same* 404.
- Rotation issues a new slug and bumps `passcode_version` (old unlock cookies die).
- Optional 4–8 digit passcode: scrypt hash; unlock = HMAC-signed, HttpOnly, SameSite=Strict
  cookie on the renderer origin (12 h). Guessing limited to 6/15 min per IP+link and 40/h per link.
- Renderer: `noindex` (header + meta), `robots.txt: Disallow /`, `Referrer-Policy: no-referrer`,
  `Cache-Control: private, no-store`, generic Open Graph text (no names/photos in chat previews).

## Web hardening

- CSP with a per-request nonce + `strict-dynamic`; no `unsafe-eval` in production; renderer
  `default-src 'none'`, `frame-ancestors 'none'`. Injected handlers/scripts are blocked (tested).
- HSTS (https), `nosniff`, `X-Frame-Options`, COOP, CORP, Permissions-Policy.
- CSRF: state-changing APIs require an `Origin` of our own; cookies are SameSite=Lax.
- Customer text is plain text rendered via JSX; `innerHTML`/`dangerouslySetInnerHTML` are banned
  by lint rules in templates. Control and bidi-override characters are stripped.
- Open redirects: `next` parameter restricted to same-site paths.
- Rate limits (Postgres, shared across instances): checkout, verify, drafts, uploads, publish,
  passcode, media refresh, reports, export, account deletion. Auth emails are rate-limited by
  Supabase Auth.

## Uploads

Type by magic bytes (never filename/MIME); images decoded with a 40-MP limit (bomb guard),
SVG/GIF/HEIC-unconverted rejected, re-encoded so **EXIF/GPS is removed**; audio must parse as
MP3/AAC/M4A, ≤ 12 MB, ≤ 8 min, with ID3/MP4 metadata (titles, cover art) neutralised. Filenames
are display-only and sanitised. Signed upload tokens are single-use. Abandoned uploads are
deleted after 24 h.

## Payments

Amount always from the database. Checkout signature verified (HMAC of `order|payment` with the
key secret) **and** payment re-fetched from Razorpay. Webhooks verified over the raw body with
the webhook secret, stored once per event id (idempotent), processed transactionally. Duplicate
captured payments are refunded automatically. Only an opaque reference is sent to Razorpay in
`notes`; payer email/phone from webhook payloads is never stored.

## Admin

Role `admin` **and** an aal2 (TOTP) session for every admin page and API. Content viewing needs a
reason and is audited; all admin writes are audited. Grant admin only via `scripts/make-admin.ts`.

## Secrets

Only `NEXT_PUBLIC_SUPABASE_URL` and the publishable key reach browsers. Service key, Razorpay
secrets, `APP_SECRET`, `CRON_SECRET` are server env vars. `server-only` imports make the build
fail if server modules are bundled for the client. Startup validation refuses live Razorpay keys
outside production, test keys in production, and non-https origins outside local.

## Personal data (India DPDP Act 2023)

Minimal collection (email + what customers type/upload). Export (`/api/account/export`) and
erasure (`DELETE /api/account`: purges files and content, deletes the auth user; orders keep
amounts only). Retention: expired/refunded sites purged after 30 days; storage backups should
expire after 30 days (bucket lifecycle rule). IPs are stored only as keyed hashes. Logs redact
personal fields and mask emails/phones in error text.

## Reporting a vulnerability

Email [security email]. Rotate secrets per DEPLOYMENT.md if exposure is suspected.
