"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Heart,
  House,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  Store,
  User,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { useViewer } from "@/components/providers/viewer-provider";
import { useRealtime } from "@/components/providers/realtime-provider";
import { signOutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/", label: "Home", icon: House },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/sell", label: "Sell", icon: Plus },
  { href: "/events", label: "Events", icon: CalendarDays },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4.5 text-white ring-2 ring-bg animate-scale-in">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconLink({ href, label, icon: Icon, count, active }: { href: string; label: string; icon: typeof Bell; count?: number; active: boolean }) {
  return (
    <Link
      href={href}
      aria-label={count ? `${label} (${count} unread)` : label}
      title={label}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-xl transition-colors",
        active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className="size-5" />
      <CountBadge count={count ?? 0} />
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const viewer = useViewer();
  const { unreadMessages, unreadNotifications } = useRealtime();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const profileHref = viewer?.username ? `/u/${viewer.username}` : "/settings";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-bg/40 backdrop-blur-md",
      )}
    >
      <div className="container-page flex h-16 items-center gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV_LINKS.map((l) => {
            const active = isActivePath(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {l.label}
                {active && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <IconLink href="/marketplace" label="Search" icon={Search} active={false} />
          {viewer ? (
            <>
              <span className="hidden md:contents">
                <IconLink href="/messages" label="Messages" icon={MessageCircle} count={unreadMessages} active={isActivePath(pathname, "/messages")} />
                <IconLink href="/favorites" label="Favorites" icon={Heart} active={isActivePath(pathname, "/favorites")} />
              </span>
              <IconLink href="/notifications" label="Notifications" icon={Bell} count={unreadNotifications} active={isActivePath(pathname, "/notifications")} />
              <span className="md:hidden">
                <IconLink href="/messages" label="Messages" icon={MessageCircle} count={unreadMessages} active={isActivePath(pathname, "/messages")} />
              </span>
              <ButtonLink href="/sell" size="sm" className="ml-2 hidden lg:inline-flex">
                <Plus className="size-4" /> Sell your vehicle
              </ButtonLink>
              <div className="ml-1 hidden md:block">
                <Menu
                  trigger={(open) => (
                    <button
                      className={cn("flex items-center rounded-full p-0.5 ring-2 transition", open ? "ring-accent" : "ring-transparent hover:ring-border-strong")}
                      aria-label="Open profile menu"
                    >
                      <Avatar src={viewer.image} name={viewer.name} size="sm" />
                    </button>
                  )}
                >
                  <div className="px-3 pb-2 pt-1.5">
                    <p className="truncate text-sm font-semibold">{viewer.name}</p>
                    {viewer.username && <p className="truncate text-xs text-muted">@{viewer.username}</p>}
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem icon={<User />} onClick={() => router.push(profileHref)}>
                    Profile
                  </MenuItem>
                  <MenuItem icon={<LayoutDashboard />} onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </MenuItem>
                  <MenuItem icon={<Heart />} onClick={() => router.push("/favorites")}>
                    Favorites
                  </MenuItem>
                  <MenuItem icon={<Settings />} onClick={() => router.push("/settings")}>
                    Settings
                  </MenuItem>
                  {viewer.role === "ADMIN" && (
                    <MenuItem icon={<Shield />} onClick={() => router.push("/admin")}>
                      Admin panel
                    </MenuItem>
                  )}
                  <div className="my-1 h-px bg-border" />
                  <MenuItem icon={<LogOut />} onClick={() => signOutAction()} danger>
                    Sign out
                  </MenuItem>
                </Menu>
              </div>
            </>
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm" className="ml-1">
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" size="sm" className="hidden sm:inline-flex">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
