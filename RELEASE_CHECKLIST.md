# Release checklist

Tick everything before taking real money. Items marked ⚠ could not be done from the development
environment and need you (or real accounts/devices).

## Business & legal
- [ ] ⚠ Fill every `[bracketed]` placeholder: legal pages (`src/app/(site)/(public)/legal/[doc]/content.ts`), contact page, `docs/SECURITY.md`.
- [ ] ⚠ Lawyer review of Terms, Privacy (DPDP Act 2023 incl. grievance officer), Refund, Delivery.
- [ ] ⚠ Confirm the music-box melody is original (not transcribed from an existing song).
- [ ] ⚠ GST registration/invoicing decision; set the final price in Admin → Templates & pricing.

## Accounts & infrastructure
- [ ] ⚠ Razorpay KYC approved; live keys + webhook (events listed in DEPLOYMENT.md) created.
- [ ] ⚠ Supabase Pro projects for staging and production (`ap-south-1`), migrations pushed, TOTP MFA on, custom SMTP configured, OTP template installed, auth rate limits set.
- [ ] ⚠ Vercel Pro project, both domains attached, env vars set per environment, `DEPLOY_ENV` correct.
- [ ] ⚠ Backup bucket with 30-day lifecycle + GitHub `production` secrets; run the backup workflow once.
- [ ] ⚠ First admin created and MFA enrolled; a second admin as backup.
- [ ] Recommended: error tracking (e.g. Sentry with PII scrubbing) — not integrated yet.

## Staging verification (Razorpay **test** mode, real Razorpay Checkout)
- [ ] ⚠ Buy with a test card and with test UPI → site appears; webhook shows *processed* in Admin.
- [ ] ⚠ Failed test payment → retry works; no duplicate site.
- [ ] ⚠ Refund from Admin → Razorpay shows the refund → site disabled.
- [ ] ⚠ Real iPhone (Safari + WhatsApp in-app browser) and a budget Android phone: open a link, play the uploaded song **and** the music box (silent switch on/off), upload a HEIC photo from the iPhone in the editor.
- [ ] ⚠ Paste a link in WhatsApp: preview shows only the generic text.
- [ ] ⚠ Restore drill (DEPLOYMENT.md → Runbooks).

## Automated (must be green on the release commit)
- [ ] `npm run typecheck` · `npm run lint`
- [ ] `npm run test:unit` · `npm run test:db`
- [ ] `npm run build` then `PW_SERVER=prod npx playwright test` (visual, motion, e2e, a11y, mobile)
- [ ] ⚠ `node scripts/lighthouse.mjs https://<staging>/demo https://<staging>/` within budget (performance ≥ 0.85, LCP ≤ 2.5 s, TBT ≤ 300 ms).
  Last local run (development laptop at 100% CPU, so pessimistic): demo 0.61 (FCP 1.5 s, LCP 4.5 s),
  landing 0.73 (LCP 3.0 s), pricing 0.70 (FCP 1.1 s, LCP 4.1 s); accessibility 1.0, best practices 0.96.
  **Not yet within budget** — measure on staging; next levers if still short: inline critical CSS,
  smaller display font for store pages, defer the paper-grain overlay.
