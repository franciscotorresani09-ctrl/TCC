"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Heart, House, LayoutDashboard, LogOut, Plus, Settings, Shield, Store, User, UserRound } from "lucide-react";
import { useViewer } from "@/components/providers/viewer-provider";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { signOutAction } from "@/server/actions/auth";
import { isActivePath } from "./navbar";
import { cn } from "@/lib/utils";

/** Thumb-friendly bottom tab bar for phones, with a floating "Sell" action. */
export function MobileNav() {
  const pathname = usePathname();
  const viewer = useViewer();
  const [sheet, setSheet] = useState(false);

  if (pathname.startsWith("/messages/")) return null; // full-screen chat on mobile

  const tab = (href: string, label: string, Icon: typeof House) => {
    const active = isActivePath(pathname, href);
    return (
      <Link
        href={href}
        className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors", active ? "text-fg" : "text-subtle")}
      >
        <Icon className={cn("size-5.5 transition-transform", active && "scale-110 text-accent")} strokeWidth={active ? 2.25 : 1.75} />
        {label}
      </Link>
    );
  };

  const sheetLink = (href: string, label: string, Icon: typeof House) => (
    <Link href={href} onClick={() => setSheet(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-[15px] transition hover:bg-surface-2">
      <Icon className="size-5 text-muted" />
      {label}
    </Link>
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/90 pb-safe backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="flex items-end px-2">
          {tab("/", "Home", House)}
          {tab("/marketplace", "Market", Store)}
          <Link href="/sell" className="flex flex-1 flex-col items-center gap-1 pb-2 text-[11px] font-medium text-fg" aria-label="Sell your vehicle">
            <span className="-mt-5 flex size-13 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow transition-transform active:scale-95">
              <Plus className="size-6 text-white" strokeWidth={2.5} />
            </span>
            Sell
          </Link>
          {tab("/events", "Events", CalendarDays)}
          {viewer ? (
            <button
              onClick={() => setSheet(true)}
              className={cn("flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium", sheet ? "text-fg" : "text-subtle")}
            >
              <Avatar src={viewer.image} name={viewer.name} size="xs" className="size-5.5" />
              Profile
            </button>
          ) : (
            tab("/sign-in", "Sign in", UserRound)
          )}
        </div>
      </nav>

      {viewer && (
        <Modal open={sheet} onClose={() => setSheet(false)} title={viewer.name ?? "Your account"} description={viewer.username ? `@${viewer.username}` : undefined}>
          <div className="-mx-2 grid gap-0.5">
            {sheetLink(viewer.username ? `/u/${viewer.username}` : "/settings", "View profile", User)}
            {sheetLink("/dashboard", "Dashboard", LayoutDashboard)}
            {sheetLink("/favorites", "Favorites", Heart)}
            {sheetLink("/settings", "Settings", Settings)}
            {viewer.role === "ADMIN" && sheetLink("/admin", "Admin panel", Shield)}
            <button
              onClick={() => signOutAction()}
              className="flex items-center gap-3 rounded-2xl px-3 py-3.5 text-[15px] text-danger transition hover:bg-danger/10"
            >
              <LogOut className="size-5" />
              Sign out
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
