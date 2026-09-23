import type { Metadata } from "next";
import { requireUserPage } from "@/server/auth-guard";
import { listNotifications, sendDueEventReminders } from "@/server/services/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const user = await requireUserPage("/notifications");
  await sendDueEventReminders().catch(() => undefined);
  const items = await listNotifications(user.id, { take: 100 });
  return (
    <div className="container-page max-w-3xl py-6 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Notifications</h1>
      <p className="mb-6 mt-1 text-muted">Messages, offers, trades, and community activity.</p>
      <NotificationList initial={items} />
    </div>
  );
}
