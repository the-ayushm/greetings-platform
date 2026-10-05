import { DemoTeaser } from "@/components/DemoTeaser";
import { ButtonLink, Card, formatINR } from "@/components/ui";
import { activeProduct } from "@/server/catalog";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "A letter in an envelope", body: "They tap the wax seal, the flap opens and your letter unfolds line by line." },
  { title: "Polaroid memories", body: "Up to 12 photos pinned, taped and clipped to a scrapbook page. Tap one to hold it closer." },
  { title: "Love coupons", body: "Little tickets they can flip over and “use” — a movie night, a hug, a day of their choice." },
  { title: "Your song", body: "Upload the song that's yours, or let our original music-box tune play." },
  { title: "A cupcake wish", body: "One tap blows out the candle, with confetti, before the last surprise." },
  { title: "One more thing…", body: "A final page with your message, your photo, and the lines you save for last." },
];

const FAQ = [
  { q: "Does the birthday person need an app or an account?", a: "No. They open the link on any phone or computer and it just works." },
  { q: "Can I change things after I've shared it?", a: "Yes. You can edit for 30 days after buying. Press Publish again and the same link shows the new version." },
  { q: "How long does the website stay up?", a: "One year from purchase. You can unpublish or delete it any time before that." },
  { q: "Can someone find it on Google?", a: "No. Every site has a long random link, is hidden from search engines, and can have a passcode." },
  { q: "Can I use any song?", a: "Please only upload a song you have the right to share privately. If you'd rather not, the built-in music box plays instead." },
];

export default async function Landing() {
  const product = await activeProduct();
  const price = product ? formatINR(product.price_paise) : null;
  return (
    <main>
      <section className="gingham border-b-2 border-ink/10">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div>
            <p className="font-hand text-2xl text-rose">a birthday surprise they can open ♡</p>
            <h1 className="mt-2 font-display text-4xl leading-tight font-semibold sm:text-5xl">A private scrapbook website, made for one person.</h1>
            <p className="mt-4 max-w-prose text-lg text-ink-soft">
              Turn your letter, photos, little coupons and your song into an interactive birthday page — then send it as one secret link.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/product">Make yours{price ? ` · ${price}` : ""}</ButtonLink>
              <ButtonLink href="/demo" variant="secondary">
                Try the demo
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-soft">Works on any phone. No app for them to install.</p>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-ink bg-ink shadow-[8px_8px_0_var(--color-pink)]">
              <DemoTeaser />
            </div>
            <p className="mt-3 text-center font-hand text-xl text-ink-soft">a real one, try it ♡</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="inside">
        <h2 id="inside" className="font-display text-3xl font-semibold">What&apos;s inside</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <Card className="h-full">
                <h3 className="font-pixel text-lg text-rose">{f.title}</h3>
                <p className="mt-2 text-ink-soft">{f.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white/70 py-14" aria-labelledby="how">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="how" className="font-display text-3xl font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Buy & sign in", "Pay securely with UPI, card or netbanking (Razorpay). Sign in with a code sent to your email."],
              ["Make it yours", "Fill in names, your letter, photos, coupons and song — with a live preview as you type."],
              ["Share the link", "Publish and send your private link on WhatsApp, or print the QR code inside a card."],
            ].map(([t, b], i) => (
              <li key={t} className="rounded-2xl border-2 border-dashed border-pink bg-cream p-5">
                <span className="font-pixel text-3xl text-rose" aria-hidden="true">0{i + 1}</span>
                <h3 className="mt-1 text-lg font-extrabold">{t}</h3>
                <p className="mt-1 text-ink-soft">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="privacy">
        <Card>
          <h2 id="privacy" className="font-display text-2xl font-semibold">Private by design</h2>
          <ul className="mt-4 grid gap-2 text-ink-soft sm:grid-cols-2">
            <li>• A long, random link nobody can guess</li>
            <li>• Optional passcode for extra privacy</li>
            <li>• Hidden from Google and other search engines</li>
            <li>• Location data removed from every photo</li>
            <li>• Change the link, unpublish or delete any time</li>
            <li>• Your photos are never public files</li>
          </ul>
        </Card>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-6 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="font-display text-3xl font-semibold">Questions</h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl border-2 border-ink/15 bg-white px-4 py-3">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="mt-2 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/product">Start making yours</ButtonLink>
        </div>
      </section>
    </main>
  );
}
