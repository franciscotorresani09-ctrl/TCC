import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { requireAdminPage } from "@/server/auth-guard";
import { db } from "@/server/db";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const openReports = await db.report.count({ where: { status: "OPEN" } });
  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft">
          <Shield className="size-5 text-accent" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h1>
          <p className="text-sm text-muted">Moderate the marketplace and keep the community safe.</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav openReports={openReports} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
