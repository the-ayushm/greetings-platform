"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  ["/admin", "Overview"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/sites", "Sites"],
  ["/admin/reports", "Reports"],
  ["/admin/events", "Payment events"],
  ["/admin/catalog", "Templates & pricing"],
  ["/admin/audit", "Audit log"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-bold">
      {NAV.map(([href, label]) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "rounded-md px-3 py-1.5 whitespace-nowrap transition-colors",
              active
                ? "bg-rose text-white"
                : "hover:bg-baby text-ink",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
