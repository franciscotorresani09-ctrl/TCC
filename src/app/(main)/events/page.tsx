import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarPlus, CalendarX, ChevronLeft, ChevronRight } from "lucide-react";
import { listUpcomingEvents } from "@/server/services/events";
import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { EVENT_TYPES, type EventTypeValue } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Automotive Events",
  description: "Discover car meets, car shows, track days, Cars & Coffee, and motorcycle meets near you.",
  alternates: { canonical: "/events" },
};

type Props = { searchParams: Promise<{ type?: string; q?: string; page?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const type = (EVENT_TYPES.values as readonly string[]).includes(sp.type ?? "") ? (sp.type as EventTypeValue) : undefined;
  const page = Math.max(1, Math.min(100, Number.parseInt(sp.page ?? "1", 10) || 1));
  const q = sp.q?.slice(0, 80);
  const { items, total, pageCount } = await listUpcomingEvents({ type, q, page, take: 12 });
  const href = (p: number) => `/events?${new URLSearchParams({ ...(type ? { type } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div className="grid-bg absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Community</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Automotive Events</h1>
            <p className="mt-3 text-muted">Car meets, shows, track days, and Cars &amp; Coffee — find your people and your next drive.</p>
          </div>
          <ButtonLink href="/events/new" size="lg">
            <CalendarPlus className="size-4" /> Create Event
          </ButtonLink>
        </div>
      </div>

      <Suspense>
        <EventFilters />
      </Suspense>

      <p className="mt-6 text-sm text-muted">
        <span className="font-semibold text-fg">{total}</span> upcoming {total === 1 ? "event" : "events"}
      </p>

      {items.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e, i) => (
            <div key={e.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <EventCard event={e} priority={i < 3} className="h-full" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-4"
          icon={CalendarX}
          title="No upcoming events"
          description="Check back soon for automotive events near you."
          action={<ButtonLink href="/events/new">Create Event</ButtonLink>}
        />
      )}

      {pageCount > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={href(page - 1)} className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-surface-2">
              <ChevronLeft className="size-4" /> Previous
            </Link>
          )}
          <span className="px-3 text-sm text-muted">
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Link href={href(page + 1)} className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-surface-2">
              Next <ChevronRight className="size-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
