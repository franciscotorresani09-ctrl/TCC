import "server-only";
import type { NotificationType } from "@prisma/client";
import { db } from "@/server/db";
import { publish } from "@/server/realtime/bus";

export const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  link: true,
  readAt: true,
  createdAt: true,
  actor: { select: { id: true, name: true, username: true, image: true } },
} as const;

export async function notify(input: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  if (input.actorId && input.actorId === input.userId) return null;
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
    select: notificationSelect,
  });
  const unreadCount = await countUnreadNotifications(input.userId);
  publish(input.userId, { type: "notification", notification, unreadCount });
  return notification;
}

export function countUnreadNotifications(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, opts: { unreadOnly?: boolean; take?: number } = {}) {
  return db.notification.findMany({
    where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 50,
  });
}
export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>[number];

export async function markNotificationsRead(userId: string, ids?: string[]) {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  const [messages, notifications] = await Promise.all([
    db.message.count({ where: { receiverId: userId, readAt: null } }),
    countUnreadNotifications(userId),
  ]);
  publish(userId, { type: "unread", messages, notifications });
}

/**
 * Event reminders: invoked lazily when an attendee loads their notifications
 * (and can also be called from a cron job). Sends one reminder per event ~24h
 * before it starts.
 */
export async function sendDueEventReminders() {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const events = await db.event.findMany({
    where: { status: "ACTIVE", reminderSentAt: null, startsAt: { gt: now, lte: soon } },
    select: { id: true, slug: true, title: true, startsAt: true, attendees: { select: { userId: true } } },
    take: 50,
  });
  for (const event of events) {
    const claimed = await db.event.updateMany({
      where: { id: event.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count === 0) continue;
    await Promise.all(
      event.attendees.map((a) =>
        notify({
          userId: a.userId,
          type: "EVENT_REMINDER",
          title: "Event starting soon",
          body: `${event.title} starts within 24 hours. See you there!`,
          link: `/events/${event.slug}`,
        }),
      ),
    );
  }
}
