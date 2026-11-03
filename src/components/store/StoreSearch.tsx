/** Product search (a plain GET form to /products — works before JavaScript loads). */
export function StoreSearch({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/products" method="get" role="search" className={`relative w-full sm:w-80 ${className}`}>
      <label htmlFor="store-search" className="sr-only">
        Search gifts
      </label>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        id="store-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="Search gifts — e.g. birthday, wedding"
        className="block min-h-12 w-full rounded-2xl border border-wine/15 bg-white pr-4 pl-10 text-[15px] shadow-[0_6px_18px_-14px_rgba(74,29,44,.5)] focus:border-rose"
      />
    </form>
  );
}
