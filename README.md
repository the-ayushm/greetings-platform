# Birthday Surprise

Sell private, interactive scrapbook-style birthday websites. A customer buys, personalises
(letter, photos, coupons, song…) with a live preview, publishes, and shares one unguessable link.
The recipient opens it on any phone — no account, no app.

The birthday experience is a faithful React port of the original single-file page, which is
kept untouched in [`legacy/`](legacy/) as the golden reference (pixel- and motion-tested).

| | |
|---|---|
| App (store, dashboard, admin) | Next.js 16 (App Router) + TypeScript + Tailwind v4 |
| Birthday renderer | Same app, **separate origin**, template CSS ported byte-for-byte |
| Data / auth / files | Supabase: Postgres + RLS, email-OTP auth, TOTP MFA, private Storage |
| Payments | Razorpay Orders + Checkout + signed webhooks |
| Hosting | Vercel (Mumbai, `bom1`) + Supabase (`ap-south-1`) |

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how it fits together and why
- [docs/SECURITY.md](docs/SECURITY.md) — threat model, isolation, privacy
- [docs/DATABASE.md](docs/DATABASE.md) — schema, RLS, database functions
- [docs/CUSTOMER-FLOW.md](docs/CUSTOMER-FLOW.md) — purchase → publish → share, step by step
- [docs/TEMPLATES.md](docs/TEMPLATES.md) — changing the template / adding a new one
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — staging & production setup, cron, backups, runbooks
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — go-live checklist

## Run locally

Requirements: Node 22+, Docker Desktop (for the local Supabase stack).

```bash
npm install
npx playwright install chromium webkit      # for tests
npm run db:start                            # local Supabase (migrations applied automatically)
cp .env.example .env.local                  # then fill with the local values below
node tests/mocks/razorpay-mock.mjs &        # local stand-in for the Razorpay API
npm run dev
```

Local `.env.local` values: `APP_ORIGIN=http://app.localhost:3000`,
`RENDERER_ORIGIN=http://wishes.localhost:3000`, the publishable/secret keys printed by
`npm run db:start`, `RAZORPAY_API_BASE=http://127.0.0.1:4010` with the mock's test-only key
values (see `.github/workflows/ci.yml`), and random `APP_SECRET` / `CRON_SECRET`.

- Store: http://app.localhost:3000 · Demo: http://app.localhost:3000/demo
- Sign-in codes arrive in the local mail catcher: http://127.0.0.1:54324
- Make yourself admin: `npx tsx scripts/make-admin.ts you@example.com`, then open `/admin`
  (you'll enrol an authenticator app on first visit).

## Tests

```bash
npm run typecheck && npm run lint
npm run test:unit        # schema, crypto, signatures, media processing, log redaction
npm run test:db          # tenant isolation straight against Postgres/Storage (customers A/B/C)
npm run build && PW_SERVER=prod npx playwright test   # everything below, against the prod build
```

Playwright projects: `visual` (100 screenshots vs the legacy file + motion timelines), `e2e`
(journey, isolation/IDOR, payments, uploads, security, admin), `a11y` (axe + keyboard),
`mobile-ios` / `mobile-android`. `npm run qa` runs the full chain.

Golden baseline: `npm run test:visual:baseline` re-captures it from `legacy/` (only needed if the
capture harness changes — never to "accept" a renderer change).

## Repository map

```
legacy/                     original single-file experience (do not edit)
src/templates/scrapbook/    the birthday experience: scenes, engine, CSS, fonts, Zod schema
src/app/(renderer)/         renderer root: /birthday/[slug], /demo, /preview/[siteId]
src/app/(site)/             store, login, checkout, dashboard + editor, admin console
src/app/api/                route handlers (customer, renderer /api/r/*, webhooks, cron, admin)
src/server/                 server-only logic: auth, orders/Razorpay, sites, media, admin, logging
src/proxy.ts                host routing, CSP nonces, security headers, session refresh
supabase/migrations/        schema, RLS, functions, seed (the only way the DB changes)
tests/                      unit, db, e2e, visual, a11y, mobile, fixtures, Razorpay mock
scripts/                    fixtures, fonts, template seed, admin bootstrap, storage backup
```
