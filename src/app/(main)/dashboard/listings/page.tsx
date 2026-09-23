import { Car } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { getSellerListings } from "@/server/services/vehicles";
import { ListingRow } from "@/components/dashboard/listing-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { LinkTabs } from "@/components/ui/tabs";

const FILTERS = ["all", "ACTIVE", "PAUSED", "SOLD"] as const;

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUserPage("/dashboard/listings");
  const { status: raw } = await searchParams;
  const status = FILTERS.includes(raw as (typeof FILTERS)[number]) ? (raw as (typeof FILTERS)[number]) : "all";
  const listings = await getSellerListings(user.id);
  const shown = status === "all" ? listings : listings.filter((l) => l.status === status);
  const count = (s: string) => listings.filter((l) => l.status === s).length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Listings</h2>
        <ButtonLink href="/sell" size="sm">
          New listing
        </ButtonLink>
      </div>
      <LinkTabs
        active={status}
        tabs={[
          { value: "all", label: "All", href: "/dashboard/listings", count: listings.length },
          { value: "ACTIVE", label: "Active", href: "/dashboard/listings?status=ACTIVE", count: count("ACTIVE") },
          { value: "PAUSED", label: "Paused", href: "/dashboard/listings?status=PAUSED", count: count("PAUSED") },
          { value: "SOLD", label: "Sold", href: "/dashboard/listings?status=SOLD", count: count("SOLD") },
        ]}
      />
      <div className="mt-4 space-y-3">
        {shown.length ? (
          shown.map((l) => <ListingRow key={l.id} listing={l} />)
        ) : (
          <EmptyState icon={Car} title="No listings here" description="Vehicles you list for sale will appear here." action={<ButtonLink href="/sell">Sell Your Vehicle</ButtonLink>} />
        )}
      </div>
    </div>
  );
}
