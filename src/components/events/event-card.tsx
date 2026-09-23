import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { EventCardData } from "@/server/services/events";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPES } from "@/lib/constants";
import { cn, formatNumber, formatTime } from "@/lib/utils";

type CardEvent = Omit<EventCardData, "startsAt" | "endsAt"> & { startsAt: Date | string; endsAt: Date | string };

export function EventCard({ event: e, className, priority }: { event: CardEvent; className?: string; priority?: boolean }) {
  const start = new Date(e.startsAt);
  const month = start.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = start.getDate();
  const past = new Date(e.endsAt) < new Date();

  return (
    <Link
      href={`/events/${e.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-border-strong",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <SafeImage
          src={e.coverImage}
          alt={e.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl border border-white/10 bg-black/60 px-2.5 py-1.5 text-center backdrop-blur-md">
          <span className="text-[10px] font-semibold tracking-wider text-accent">{month}</span>
          <span className="text-lg font-bold leading-none">{day}</span>
        </div>
        <Badge tone="glass" className="absolute right-3 top-3">
          {EVENT_TYPES.labels[e.type]}
        </Badge>
        {(past || e.status === "CANCELLED") && (
          <Badge tone="danger" className="absolute bottom-3 left-3 bg-black/70">
            {e.status === "CANCELLED" ? "Cancelled" : "Ended"}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
          <CalendarDays className="size-3.5" />
          {start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {formatTime(start)}
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight">{e.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {e.city}, {e.state}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Users className="size-3.5" />
            {formatNumber(e._count.attendees)} attending
          </span>
        </div>
      </div>
    </Link>
  );
}
