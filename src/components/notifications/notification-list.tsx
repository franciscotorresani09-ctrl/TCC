"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSyncedState } from "@/hooks/use-synced-state";
import { ArrowLeftRight, BadgeDollarSign, Bell, BellOff, CalendarClock, CheckCheck, Handshake, Heart, MessageCircle, Star, Tag, UserPlus, Users } from "lucide-react";
import type { NotificationItem } from "@/server/services/notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useRealtime, useRealtimeEvent } from "@/components/providers/realtime-provider";
import { markNotificationsReadAction } from "@/server/actions/social";
import { cn, timeAgo } from "@/lib/utils";

const ICONS: Record<string, { icon: typeof Bell; className: string }> = {
  NEW_MESSAGE: { icon: MessageCircle, className: "text-info bg-info/10" },
  NEW_OFFER: { icon: BadgeDollarSign, className: "text-success bg-success/10" },
  OFFER_UPDATED: { icon: BadgeDollarSign, className: "text-success bg-success/10" },
  TRADE_PROPOSAL: { icon: ArrowLeftRight, className: "text-accent bg-accent-soft" },
  TRADE_ACCEPTED: { icon: Handshake, className: "text-success bg-success/10" },
  TRADE_UPDATED: { icon: ArrowLeftRight, className: "text-accent bg-accent-soft" },
  LISTING_FAVORITED: { icon: Heart, className: "text-accent bg-accent-soft" },
  LISTING_SOLD: { icon: Tag, className: "text-warning bg-warning/10" },
  EVENT_REMINDER: { icon: CalendarClock, className: "text-warning bg-warning/10" },
  EVENT_RSVP: { icon: Users, className: "text-info bg-info/10" },
  NEW_FOLLOWER: { icon: UserPlus, className: "text-info bg-info/10" },
  NEW_REVIEW: { icon: Star, className: "text-warning bg-warning/10" },
};

type Item = Omit<NotificationItem, "createdAt" | "readAt"> & { createdAt: Date | string; readAt: Date | string | null };

export function NotificationList({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const { setUnreadNotifications } = useRealtime();
  const [items, setItems] = useSyncedState<Item[]>(initial);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pending, start] = useTransition();

  useRealtimeEvent((e) => {
    if (e.type === "notification") setItems((prev) => [e.notification as unknown as Item, ...prev.filter((p) => p.id !== e.notification.id)]);
  });

  const unread = items.filter((i) => !i.readAt).length;
  const shown = filter === "unread" ? items.filter((i) => !i.readAt) : items;

  const markAll = () =>
    start(async () => {
      setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })));
      setUnreadNotifications(0);
      await markNotificationsReadAction();
      router.refresh();
    });

  const open = (n: Item) => {
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date() } : i)));
      markNotificationsReadAction([n.id]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-border p-1">
          {(["all", "unread"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", filter === f ? "bg-elevated text-fg" : "text-muted hover:text-fg")}>
              {f === "all" ? "All" : `Unread${unread ? ` (${unread})` : ""}`}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={markAll} disabled={!unread} loading={pending}>
          <CheckCheck className="size-4" /> Mark all as read
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={BellOff}
          title={filter === "unread" ? "You're all caught up" : "No notifications yet"}
          description={filter === "unread" ? "New activity on your listings, offers, and events will show up here." : "When people message you, make offers, or follow you, you'll see it here."}
        />
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {shown.map((n) => {
            const meta = ICONS[n.type] ?? { icon: Bell, className: "text-muted bg-surface-2" };
            const Icon = meta.icon;
            const body = (
              <div className={cn("flex gap-3 p-4 transition hover:bg-surface-2", !n.readAt && "bg-accent/[0.04]")}>
                <div className="relative shrink-0">
                  {n.actor ? <Avatar src={n.actor.image} name={n.actor.name} /> : <span className={cn("flex size-10 items-center justify-center rounded-full", meta.className)}><Icon className="size-5" /></span>}
                  {n.actor && (
                    <span className={cn("absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-surface", meta.className)}>
                      <Icon className="size-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", n.readAt ? "font-medium" : "font-semibold")}>{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-subtle">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </div>
            );
            return (
              <li key={n.id} className="animate-fade-in">
                {n.link ? (
                  <Link href={n.link} onClick={() => open(n)}>
                    {body}
                  </Link>
                ) : (
                  <button className="w-full text-left" onClick={() => open(n)}>
                    {body}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
