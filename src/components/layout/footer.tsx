import Link from "next/link";
import { Logo } from "./logo";
import { SITE } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "Browse vehicles" },
      { href: "/marketplace?category=sports-cars", label: "Sports cars" },
      { href: "/marketplace?category=electric-vehicles", label: "Electric vehicles" },
      { href: "/marketplace?category=motorcycles", label: "Motorcycles" },
      { href: "/sell", label: "Sell your vehicle" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/events", label: "Upcoming events" },
      { href: "/events/new", label: "Create an event" },
      { href: "/dashboard/trades", label: "Trade proposals" },
      { href: "/favorites", label: "Favorites" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Street-Car" },
      { href: "/safety", label: "Safety tips" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface/40 pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{SITE.description}</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} Street-Car, Inc. All rights reserved.</p>
          <p>Built for people who love cars.</p>
        </div>
      </div>
    </footer>
  );
}
