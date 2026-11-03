import Link from "next/link";
import { CATEGORIES } from "@/lib/store";
import { currentUser, isAdminUser } from "@/server/auth";
import { listStoreProducts } from "@/server/catalog";
import { MainNav } from "./store/MainNav";

/** The brand mark, used in the header and footer. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold text-wine ${className}`}>
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(145deg,#e0445f,#a32f45)] text-base text-white shadow-[0_6px_14px_-6px_rgba(163,47,69,.8)]">
        ♡
      </span>
      <span className="text-xl italic">Digital Gifting</span>
    </span>
  );
}

export async function SiteHeader() {
  const user = await currentUser();
  const isAdmin = user ? await isAdminUser(user.id) : false;
  return (
    <header className="sticky top-0 z-40 border-b border-wine/10 bg-ivory/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Digital Gifting — home" className="shrink-0">
          <BrandMark />
        </Link>
        <MainNav signedIn={Boolean(user)} isAdmin={isAdmin} />
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const [user, products] = await Promise.all([currentUser(), listStoreProducts()]);
  // Only categories with something on sale (no dead ends).
  const categories = CATEGORIES.filter((c) => products.some((p) => p.meta.categories.includes(c.id)));
  const col = "space-y-2.5 text-sm";
  const head = "mb-3 text-xs font-extrabold tracking-[.16em] text-wine uppercase";
  const a = "text-ink-soft transition hover:text-rose";
  return (
    <footer className="mt-20 shrink-0 border-t border-wine/10 bg-[linear-gradient(180deg,#fff8ec,#fbeef0)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label="Digital Gifting — home">
            <BrandMark />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Personalised interactive websites and digital gifts — birthday surprises, love stories, romantic questions and wedding invitations — sent as one private link.
          </p>
        </div>
        <nav aria-label="Shop">
          <p className={head}>Shop</p>
          <ul className={col}>
            <li>
              <Link className={a} href="/products">
                Explore all gifts
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link className={a} href={`/categories/${c.slug}`}>
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link className={a} href="/pricing">
                Pricing
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Your account">
          <p className={head}>Your account</p>
          <ul className={col}>
            {user ? (
              <>
                <li>
                  <Link className={a} href="/dashboard">
                    My Sites
                  </Link>
                </li>
                <li>
                  <Link className={a} href="/dashboard/account">
                    Account
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link className={a} href="/login">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link className={a} href="/login?mode=signup">
                    Create an account
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link className={a} href="/#how-it-works">
                How it works
              </Link>
            </li>
            <li>
              <Link className={a} href="/contact">
                Contact us
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className={head}>Policies</p>
          <ul className={col}>
            <li>
              <Link className={a} href="/legal/terms">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link className={a} href="/legal/privacy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className={a} href="/legal/refund">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link className={a} href="/legal/delivery">
                Delivery Policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-wine/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-soft sm:px-6">© {new Date().getFullYear()} Digital Gifting. Made with care in India ♡</p>
      </div>
    </footer>
  );
}
