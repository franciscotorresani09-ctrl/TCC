import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { getDashboardOverview } from "@/server/services/dashboard";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/dashboard");
  const o = await getDashboardOverview(user.id);
  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{user.name?.split(" ")[0] ?? "Driver"}</h1>
        </div>
        <ButtonLink href="/sell" className="hidden sm:inline-flex">
          <Plus className="size-4" /> New listing
        </ButtonLink>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DashboardNav counts={{ "/dashboard/offers": o.pendingOffers, "/dashboard/trades": o.pendingTrades, "/dashboard/messages": o.unreadMessages }} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
