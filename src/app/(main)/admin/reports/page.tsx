import Link from "next/link";
import { Flag } from "lucide-react";
import { requireAdminPage } from "@/server/auth-guard";
import { adminListReports } from "@/server/services/admin";
import { adminResolveReportAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { REPORT_REASONS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdminPage();
  const raw = (await searchParams).status;
  const status = raw === "RESOLVED" || raw === "DISMISSED" ? raw : "OPEN";
  const reports = await adminListReports(status);
  return (
    <div>
      <LinkTabs
        active={status}
        tabs={[
          { value: "OPEN", label: "Open", href: "/admin/reports" },
          { value: "RESOLVED", label: "Resolved", href: "/admin/reports?status=RESOLVED" },
          { value: "DISMISSED", label: "Dismissed", href: "/admin/reports?status=DISMISSED" },
        ]}
      />
      <div className="mt-4 space-y-3">
        {reports.length ? (
          reports.map((r) => {
            const target = r.vehicle
              ? { label: `Listing: ${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}`, href: `/vehicles/${r.vehicle.slug}` }
              : r.event
                ? { label: `Event: ${r.event.title}`, href: `/events/${r.event.slug}` }
                : r.targetUser
                  ? { label: `User: ${r.targetUser.name}`, href: `/u/${r.targetUser.username}` }
                  : { label: `Review: “${r.review?.comment.slice(0, 60)}…”`, href: "/admin/reviews" };
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="warning">{REPORT_REASONS.labels[r.reason]}</Badge>
                  <span className="text-xs text-subtle">
                    Reported by {r.reporter.name} · {timeAgo(r.createdAt)}
                  </span>
                </div>
                <Link href={target.href} className="mt-2 block font-medium hover:underline">
                  {target.label}
                </Link>
                {r.details && <p className="mt-1 text-sm text-muted">{r.details}</p>}
                {status === "OPEN" && (
                  <div className="mt-3 flex gap-2">
                    <AdminButton variant="primary" action={adminResolveReportAction.bind(null, r.id, "RESOLVED")}>
                      Mark resolved
                    </AdminButton>
                    <AdminButton variant="ghost" action={adminResolveReportAction.bind(null, r.id, "DISMISSED")}>
                      Dismiss
                    </AdminButton>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState icon={Flag} title="No reports" description="Nothing needs your attention right now." />
        )}
      </div>
    </div>
  );
}
