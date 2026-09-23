import { Activity, CalendarDays, Car, Flag, Tag, Users, UserPlus, DollarSign } from "lucide-react";
import { requireAdminPage } from "@/server/auth-guard";
import { getAdminStats } from "@/server/services/admin";
import { Card, CardHeader } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export default async function AdminOverview() {
  await requireAdminPage();
  const s = await getAdminStats();
  const cards = [
    { label: "Total users", value: s.totalUsers, icon: Users, sub: `+${s.newUsers} in 30 days` },
    { label: "Active users", value: s.activeUsers, icon: Activity, sub: "Seen in the last 30 days" },
    { label: "Active listings", value: s.activeListings, icon: Car, sub: `+${s.newListings} in 30 days` },
    { label: "Sold vehicles", value: s.soldVehicles, icon: Tag, sub: "All time" },
    { label: "Upcoming events", value: s.events, icon: CalendarDays, sub: "Active & scheduled" },
    { label: "Open reports", value: s.openReports, icon: Flag, sub: "Awaiting review" },
    { label: "New signups", value: s.newUsers, icon: UserPlus, sub: "Last 30 days" },
    { label: "Revenue", value: "—", icon: DollarSign, sub: "Monetization not enabled" },
  ];
  const max = Math.max(1, ...s.listingsByDay.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{label}</p>
              <Icon className="size-4 text-accent" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{typeof value === "number" ? formatNumber(value) : value}</p>
            <p className="text-[11px] text-subtle">{sub}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader title="New listings" description="Last 14 days" />
        <div className="p-5">
          <div className="flex h-44 gap-1.5" role="img" aria-label="Bar chart of new listings per day over the last 14 days">
            {s.listingsByDay.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-subtle opacity-0 transition group-hover:opacity-100">{d.count}</span>
                <div className="w-full rounded-t-md bg-accent/80 transition group-hover:bg-accent" style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }} />
                <span className="text-[10px] text-subtle">{new Date(d.date).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
