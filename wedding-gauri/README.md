# Rudra & Gauri — Wedding Invitation (recovered)

A standalone recreation of **https://aavjoo.in/i/rudra-weds-gauri** (Aavjoo "gaurishankar" template).
Plain HTML, CSS and JavaScript with no framework, no build step and no runtime dependencies. It runs from any static host and does not need the original site to be online.

## How it was recovered

The original site is a Next.js 16 (Turbopack) app on Vercel. Its source maps are not public (they return `403`), so I couldn't get the original source files back. Instead:

1. I downloaded the production HTML, all CSS/JS chunks, the page's RSC data payload, every image, the fonts and the music file.
2. I beautified the compiled bundle and located the **gaurishankar** template, its base theme (`eB`), the shared sections (scratch card, countdown, gallery, RSVP, music, scroll hint) and the page renderer. That gave me every class name, colour, size, delay, duration and easing curve.
3. I rebuilt those components in vanilla JS (`js/app.js`). The framer-motion behaviours the page uses (keyframes, per-property transitions, cubic-bézier easing, springs, scroll-linked values, in-view reveals) are re-implemented in a 250-line engine (`js/motion.js`).
4. I **reused the original compiled stylesheet verbatim** (`css/aavjoo.css`), so every utility class renders exactly as before.
5. I compared both sites with Playwright at 360, 390, 430, 768, 1024 and 1440 px (see `comparison/`).

## Run locally

Requires Node.js 18 or newer (only for the bundled static server; any static server works).

```bash
npm start            # http://localhost:8080
# or:  npx serve .   /   python -m http.server 8080
```

Opening `index.html` directly from disk also works, but autoplaying audio and some fonts behave better over `http://`.

## Deploy

Upload these files and folders to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, shared hosting):

```
index.html  css/  js/  assets/
```

You don't need anything else: no build step, no server code and no environment variables. Leave `tools/`, `comparison/`, `_recon/`, `node_modules/` and `package*.json` out of the upload.

For link previews on WhatsApp and social sites, change `og:image` / `twitter:image` in `index.html` to an **absolute** URL on your domain, e.g. `https://your-domain/assets/og-image.jpg`.

## Project structure

```
index.html            page shell + meta tags
css/
  aavjoo.css          ORIGINAL compiled Tailwind v4 stylesheet (unchanged)
  fonts.css           @font-face rules for the 7 families used (recovered next/font output)
  site.css            project-specific additions (minimal)
js/
  data.js             ← ALL CONTENT: names, families, dates, events, RSVP number, music, photos, UI text
  motion.js           animation engine (framer-motion subset)
  app.js              the invitation: opening, hero, families, scratch card, countdown,
                      events, gallery + lightbox, RSVP, closing, frame, music, scroll hint
assets/
  illus/              Shiv–Parvati artwork: sky, Kailash, hand, step, event card, Om seals
  moments/            gallery photos m1–m4
  music/              piya-ghar-aavenge.mp3
  fonts/              woff2 files (Cinzel, Cormorant Garamond, Great Vibes, Parisienne,
                      Tiro Devanagari Hindi, Geist, Manrope)
  icons/              favicon + apple-touch icon
  og-image.jpg        original 1200×630 share image
tools/
  serve.js            zero-dependency static server
  compare.js          Playwright visual diff vs the original (all widths)
  interact.js         Playwright interaction diff (scratch, gallery, RSVP, links, music)
  smoke.js            quick console-error check
comparison/           original | recreation | diff screenshots + report.json
_recon/               recovery workspace (downloaded bundles, beautified code, raw captures).
                      For reference only; not needed to run or deploy.
```

## Customising

Change the content in **`js/data.js`**. You shouldn't need to touch `app.js` for that.

- **Names, parents, hosts, message, city, hashtag**: top-level fields.
- **Events**: the `events` array. Times are ISO-8601 with `+05:30` and are shown in IST. Directions and *Save date* links are built from `venue` + `address`. To use an exact pin, add `mapUrl: 'https://maps.app.goo.gl/…'` to an event.
- **RSVP**: `rsvp.phone` is the WhatsApp number in international format without `+`. `rsvp.by` is the reply-by date.
- **Music**: `music` (path to an mp3). It loops at 60% volume after the guest taps to open, and pauses when the tab is hidden.
- **Gallery**: `gallery` (list of image paths; 4:5 portrait works best).
- **Footer credit**: `noBranding: true` hides it. `brandName` / `brandHref` change it.
- **UI wording**: `window.STRINGS` at the bottom of `data.js`.

## Features (all from the original)

| # | Feature | Notes |
|---|---------|-------|
| 1–2 | Tap-anywhere opening screen | Shiva's hand slides in, Parvati's foot steps down, a glow blooms, then the "Written by destiny…" text and names appear. The tap hint shows at 7.5 s. Tapping fades the cover (1.3 s) and starts the music. The cover is removed at 6.2 s. |
| 3–4 | Ganesha mantra + hero | 210 dvh sticky Kailash scene. On scroll the image zooms ×1.8, the text lifts and fades, and the scene fades out. Petals fall and clouds drift. |
| 5 | Families | Om, hosts, message, both names (optically centred) with parents. Scales in from 0.5 as you scroll. |
| 6 | Save the date | Canvas gold-foil scratch card. Scratching more than 50% (or tapping "reveal instead") bursts marigolds, jasmine and petals. |
| 7 | Countdown | Days, hours, minutes and seconds to 18 Feb 2027, 11:00 IST. Changes to "Just married!" once the date passes. |
| 8 | Event cards | Haldi, Sangeet, Wedding and Reception on the jasmine-arch card artwork. |
| 9–10 | Directions / Save date | Google Maps search and Google Calendar template links (the same URLs as the original). |
| 11 | Gallery | Snap-scrolling tilted polaroids with position dots. Lightbox with prev/next, swipe, Esc/arrow keys and tap-outside to close. |
| 12–16 | RSVP | Accept/decline, name, guest counter (1–12), per-event chips with validation, note, then **Send RSVP on WhatsApp** (`wa.me` with a pre-filled message). |
| 17 | Closing | Arched artwork, blessing line, names, hashtag, credit. |
| — | Extras | Decorative edge frame that fades in on scroll, "Scroll to see more" pill, music toggle with animated bars, text auto-fit, `prefers-reduced-motion` support. |

## Testing / visual comparison

```bash
npm install                      # installs Playwright + pixelmatch (dev only)
npx playwright install chromium
npm start                        # in one terminal
npm run compare                  # all widths → comparison/w<width>/*.png + report.json
node tools/interact.js --local "http://localhost:8080/?demo"   # interaction parity
```

Each comparison image shows **original | recreation | diff** (changed pixels in red). The scripts freeze `Date.now()` so both countdowns show the same values.

`?demo` on the URL reproduces the original's RSVP behaviour exactly (see below).

## Differences and things that couldn't be recovered

- **RSVP behaviour (deliberate).** On aavjoo.in this page is registered as a platform *demo*, so pressing *Send RSVP* only shows "This is a demo invitation, so nothing was sent…" and never opens WhatsApp. As requested, this recreation **actually opens WhatsApp** with the pre-filled message. Set `rsvp.demo: true` in `data.js`, or add `?demo` to the URL, to get the original behaviour back.
- **RSVP phone number.** `919699711809` is the value in the original page data. The same number appears on all the platform's demo invites, so **replace it with your own number** before sharing.
- **RSVP logging.** The original also sent each reply to a private server action (`recordRsvp`) on Aavjoo's backend. That endpoint is private, so it isn't reproduced; replies go only to WhatsApp.
- **Analytics.** Google Analytics (`G-XWCTML8XFJ`) and Vercel scripts were left out on purpose.
- **Footer link.** The original "Crafted with love by Aavjoo" points to `/` on aavjoo.in. Here it points to `https://aavjoo.in/` so it still works off-platform. Change or hide it in `data.js`.
- **Image encoding.** The original serves images through Next.js `/_next/image` (re-encoded WebP/JPEG at quality 75, resized per device). This copy uses the original full-resolution files, so you may see a sub-pixel difference in image texture. Layout and colours are identical.
- **Animation timing.** Animations use the original durations, delays and easing curves. Screenshots taken mid-animation can still differ by a few frames, because the original starts its clocks after React hydration and this copy starts them at script load.
- **Share image.** `assets/og-image.jpg` is the original dynamically generated image, saved as a static file.
- **Source code.** The original React/TypeScript source can't be recovered (no public source maps). `js/app.js` is a faithful hand-port of the compiled output.
