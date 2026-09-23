import Link from "next/link";
import { cn } from "@/lib/utils";

/** URL-driven tabs (server-friendly, shareable, and back-button aware). */
export function LinkTabs({
  tabs,
  active,
  className,
}: {
  tabs: { value: string; label: string; href: string; count?: number }[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={cn("scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0", className)} aria-label="Tabs">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <Link
            key={t.value}
            href={t.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              isActive ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs", isActive ? "bg-accent text-white" : "bg-elevated text-muted")}>{t.count}</span>
            )}
            {isActive && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
