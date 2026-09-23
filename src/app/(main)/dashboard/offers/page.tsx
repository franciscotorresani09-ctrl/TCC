import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { listOffers } from "@/server/services/deals";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { SafeImage } from "@/components/ui/safe-image";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { OfferActions } from "@/components/offers/deal-actions";
import { OFFER_STATUSES } from "@/lib/constants";
import { formatPrice, timeAgo, vehicleTitle } from "@/lib/utils";

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUserPage("/dashboard/offers");
  const tab = (await searchParams).tab === "outgoing" ? "outgoing" : "incoming";
  const offers = await listOffers(user.id);
  const list = offers[tab];

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Offers</h2>
      <LinkTabs
        active={tab}
        tabs={[
          { value: "incoming", label: "Incoming", href: "/dashboard/offers", count: offers.incoming.length },
          { value: "outgoing", label: "Outgoing", href: "/dashboard/offers?tab=outgoing", count: offers.outgoing.length },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.length ? (
          list.map((o) => {
            const other = tab === "incoming" ? o.buyer : o.seller;
            const diff = ((o.amount - o.vehicle.price) / o.vehicle.price) * 100;
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link href={`/vehicles/${o.vehicle.slug}`} className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-32">
                    <SafeImage src={o.vehicle.images[0]?.url ?? ""} alt="" fill sizes="128px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{vehicleTitle(o.vehicle)}</p>
                      <StatusBadge status={o.status} label={OFFER_STATUSES.labels[o.status]} />
                    </div>
                    <p className="mt-1 text-2xl font-bold">
                      {formatPrice(o.amount)} <span className="text-sm font-normal text-muted">vs {formatPrice(o.vehicle.price)} asking ({diff.toFixed(1)}%)</span>
                    </p>
                    {o.counterAmount && <p className="text-sm text-info">Counter offer: {formatPrice(o.counterAmount)}</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <Avatar src={other.image} name={other.name} size="xs" />
                      {tab === "incoming" ? "From" : "To"} {other.name} · {timeAgo(o.updatedAt)}
                    </div>
                    {o.message && <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">“{o.message}”</p>}
                  </div>
                </div>
                <div className="mt-3 empty:hidden">
                  <OfferActions offerId={o.id} status={o.status} role={tab === "incoming" ? "seller" : "buyer"} />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={CircleDollarSign}
            title={tab === "incoming" ? "No offers received yet" : "You haven't made any offers"}
            description={tab === "incoming" ? "Offers from buyers on your listings will show up here." : "Find a vehicle you love and make the seller an offer."}
          />
        )}
      </div>
    </div>
  );
}
