"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Car, Flag, LayoutGrid, Gauge, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Car },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
];

export function AdminNav({ openReports }: { openReports: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition", active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
            <Icon className={cn("size-4.5", active && "text-accent")} />
            {label}
            {href === "/admin/reports" && openReports > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{openReports}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
