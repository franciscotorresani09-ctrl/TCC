import Link from "next/link";
import type { ListingStatus } from "@prisma/client";
import { requireAdminPage } from "@/server/auth-guard";
import { adminListVehicles } from "@/server/services/admin";
import { adminUpdateVehicleAction } from "@/server/actions/admin";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminTable, Td } from "@/components/admin/table";
import { StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LinkTabs } from "@/components/ui/tabs";
import { formatNumber, formatPrice, vehicleTitle } from "@/lib/utils";

const STATUSES = ["ACTIVE", "PAUSED", "SOLD", "REMOVED"] as const;

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? (sp.status as ListingStatus) : undefined;
  const q = sp.q?.slice(0, 80);
  const vehicles = await adminListVehicles(q, status);
  return (
    <div>
      <LinkTabs
        active={status ?? "all"}
        tabs={[{ value: "all", label: "All", href: "/admin/listings" }, ...STATUSES.map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase(), href: `/admin/listings?status=${s}` }))]}
      />
      <form className="my-4 max-w-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={q} placeholder="Search make or model" aria-label="Search listings" />
      </form>
      <AdminTable head={["Vehicle", "Seller", "Price", "Views", "Reports", "Status", "Actions"]}>
        {vehicles.map((v) => (
          <tr key={v.id}>
            <Td>
              <Link href={`/vehicles/${v.slug}`} className="font-medium hover:underline">
                {vehicleTitle(v)}
              </Link>
              {v.isFeatured && <span className="ml-2 text-xs text-accent">★ Featured</span>}
            </Td>
            <Td className="text-muted">{v.seller.name}</Td>
            <Td>{formatPrice(v.price)}</Td>
            <Td>{formatNumber(v.views)}</Td>
            <Td className={v._count.reports ? "text-danger" : ""}>{v._count.reports}</Td>
            <Td>
              <StatusBadge status={v.status} />
            </Td>
            <Td>
              <div className="flex flex-wrap gap-2">
                <AdminButton variant="ghost" action={adminUpdateVehicleAction.bind(null, v.id, { isFeatured: !v.isFeatured })}>
                  {v.isFeatured ? "Unfeature" : "Feature"}
                </AdminButton>
                {v.status !== "REMOVED" ? (
                  <AdminButton variant="danger" action={adminUpdateVehicleAction.bind(null, v.id, { status: "REMOVED" })} confirm={{ title: "Remove this listing?", description: "It will be hidden from the marketplace." }}>
                    Remove
                  </AdminButton>
                ) : (
                  <AdminButton action={adminUpdateVehicleAction.bind(null, v.id, { status: "ACTIVE" })}>Restore</AdminButton>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
