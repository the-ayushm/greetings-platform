import Link from "next/link";
import { currentUser } from "@/server/auth";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="border-b-2 border-ink/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold italic text-rose">
          Birthday Surprise <span aria-hidden="true">♡</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-bold sm:gap-3">
          <Link className="rounded-md px-2 py-2 hover:bg-baby" href="/demo">
            Demo
          </Link>
          <Link className="rounded-md px-2 py-2 hover:bg-baby" href="/product">
            Pricing
          </Link>
          {user ? (
            <>
              <Link className="rounded-md px-2 py-2 hover:bg-baby" href="/dashboard">
                My sites
              </Link>
              <Link className="rounded-md px-2 py-2 hover:bg-baby" href="/dashboard/account">
                Account
              </Link>
            </>
          ) : (
            <Link className="rounded-md bg-ink px-3 py-2 text-white hover:bg-rose" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 shrink-0 border-t-2 border-ink/10 bg-white/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-ink-soft">© {new Date().getFullYear()} Birthday Surprise. Made with care in India.</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2 font-bold">
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/refund">Refunds</Link>
          <Link href="/legal/delivery">Delivery</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
