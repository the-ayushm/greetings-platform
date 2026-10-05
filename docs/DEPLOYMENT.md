# Deployment

## Environments

| | Local | Staging | Production |
|---|---|---|---|
| App host | `next dev` | Vercel **Preview** | Vercel **Production** |
| Origins | `app.localhost:3000` / `wishes.localhost:3000` | `staging.example.in` / `wishes-staging.example.in` | `www.example.in` / `wishes.example.in` (or a separate domain) |
| Supabase | CLI in Docker | separate project | separate project (Mumbai `ap-south-1`) |
| Razorpay | local mock | **test** keys (`rzp_test_…`) | **live** keys (`rzp_live_…`) |
| `DEPLOY_ENV` | `local` | `staging` | `production` |

The app refuses to start with live keys outside production, test keys in production, a
non-Razorpay API base outside local, or http origins outside local.

## One-time setup

1. **Domains.** App domain and renderer domain (prefer a separate registrable domain for the
   renderer, e.g. `example-wishes.in`; a subdomain works because cookies are host-only). Add both
   to the Vercel project.
2. **Supabase (per environment).** Create the project in `ap-south-1`, Pro plan (free projects
   pause). Then:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push            # applies supabase/migrations
   ```
   Auth settings: Site URL = app origin; **Redirect URLs must include `<app origin>/auth/callback`**
   (sign-in links land there); **enable TOTP MFA**. Sign-in uses Supabase's default magic-link
   email (no custom template needed). The built-in email sender is heavily rate-limited (a few
   emails per hour), so set custom SMTP (e.g. Resend/Postmark) before launch.
3. **Razorpay.** Complete KYC (needs the live Terms, Privacy, Refund, Delivery and Contact pages —
   fill the [bracketed] details in `src/app/(site)/(public)/legal/[doc]/content.ts` and
   `contact/page.tsx` first). Create a webhook to `https://<app>/api/webhooks/razorpay` with events
   `order.paid`, `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`,
   `refund.failed`, and a strong secret. Payment capture: automatic.
4. **Vercel.** Import the repo; framework Next.js; region `bom1` (from `vercel.json`). Set the
   env vars from `.env.example` separately for Preview and Production. Vercel **Pro** is required
   for commercial use and for the 10-minute reconcile cron. `CRON_SECRET` is sent by Vercel Cron.
5. **Backups.** Create an R2/S3 bucket with a 30-day expiry lifecycle rule; add the `BACKUP_S3_*`
   and `SUPABASE_*` secrets to the GitHub `production` environment (`.github/workflows/backup.yml`).
6. **First admin.** Sign in once on production, then
   `NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SECRET_KEY=… npx tsx scripts/make-admin.ts you@…`,
   open `/admin`, enrol an authenticator app.

## Release

1. Open a PR → CI (`.github/workflows/ci.yml`) runs typecheck, lint, unit, DB isolation, build,
   and every Playwright suite against the production build with a local Supabase.
2. Merge → `supabase db push` to **staging**, Vercel deploys Preview → smoke-test with Razorpay
   test cards/UPI (see RELEASE_CHECKLIST.md).
3. `supabase db push` to **production** (migrations are additive; never edit an applied one),
   then promote the deployment.

## Cron

| Path | Schedule | Does |
|---|---|---|
| `/api/cron/reconcile` | every 10 min | fulfils paid orders whose webhook was missed, expires 3-day-old unpaid orders, settles pending refunds, retries failed webhook events |
| `/api/cron/cleanup` | daily 03:00 IST | deletes abandoned uploads, expires 1-year-old sites, purges expired/refunded sites after 30 days, clears old rate-limit rows |

## Monitoring

- Vercel logs / log drain (JSON lines, `event` field). Alert on `webhook.failed`,
  `reconcile.*_failed`, `payment.duplicate_refund_failed`, `api.unhandled`.
- Admin → Overview: unprocessed payment events, open reports, unpaid orders.
- Razorpay dashboard → Webhooks: delivery failures.

## Runbooks

- **Customer paid, no site:** Admin → Orders → find by `order_…` id → events. Click *Retry* on an
  unprocessed event, or wait for reconcile (≤ 10 min). Never create sites by hand.
- **Refund:** Admin → order → *Refund in full* (reason required). The site is disabled when
  Razorpay confirms.
- **Copyright/abuse report:** Admin → Reports → *Disable site & close* or *Dismiss*. Contact the
  customer from the order email.
- **Leaked link:** the customer clicks *Make a new link* (or Admin disables the site).
- **Secret rotation:** generate new value → update Vercel env (and Razorpay webhook secret in both
  places) → redeploy. Rotating `APP_SECRET` logs everyone out of passcode-unlocked pages only.
  Rotating the Supabase secret key: create a new secret key in Supabase, deploy, revoke the old.
- **Restore drill (do before launch, then quarterly):** restore the latest Supabase backup into a
  scratch project, sync the backup bucket into its storage with the same paths, point a preview
  deployment at it and open a known published link.
