import Link from "next/link";
import { ArrowLeftRight, CircleDollarSign, ExternalLink } from "lucide-react";
import type { ChatMessage } from "@/server/services/messages";
import { SafeImage } from "@/components/ui/safe-image";
import { StatusBadge } from "@/components/ui/badge";
import { OfferActions, TradeActions } from "@/components/offers/deal-actions";
import { OFFER_STATUSES, TRADE_STATUSES } from "@/lib/constants";
import { formatPrice, formatSignedCash, vehicleTitle } from "@/lib/utils";

type MiniVehicle = NonNullable<ChatMessage["vehicle"]>;

export function ListingPreview({ vehicle, compact }: { vehicle: MiniVehicle; compact?: boolean }) {
  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-bg/60 p-2 transition hover:border-border-strong">
      <span className={`relative shrink-0 overflow-hidden rounded-xl bg-surface-2 ${compact ? "size-10" : "size-16"}`}>
        <SafeImage src={vehicle.images[0]?.url ?? ""} alt="" fill sizes="64px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium group-hover:underline">{vehicleTitle(vehicle)}</span>
        <span className="text-sm font-semibold text-accent">{formatPrice(vehicle.price)}</span>
        {!compact && (
          <span className="block text-xs text-muted">
            {vehicle.city}, {vehicle.state}
            {vehicle.status !== "ACTIVE" && ` · ${vehicle.status.toLowerCase()}`}
          </span>
        )}
      </span>
      <ExternalLink className="mr-1 size-4 shrink-0 text-subtle" />
    </Link>
  );
}

export function OfferCard({ offer, viewerId }: { offer: NonNullable<ChatMessage["offer"]>; viewerId: string }) {
  const role = offer.sellerId === viewerId ? "seller" : "buyer";
  return (
    <div className="w-72 max-w-full rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 to-transparent p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
          <CircleDollarSign className="size-4" /> Offer
        </span>
        <StatusBadge status={offer.status} label={OFFER_STATUSES.labels[offer.status]} />
      </div>
      <p className="mt-2 text-2xl font-bold">{formatPrice(offer.amount)}</p>
      {offer.counterAmount && offer.status === "COUNTERED" && <p className="text-sm text-muted">Counter: {formatPrice(offer.counterAmount)}</p>}
      <p className="mt-1 truncate text-xs text-muted">for {vehicleTitle(offer.vehicle)} · asking {formatPrice(offer.vehicle.price)}</p>
      <div className="mt-3 empty:hidden">
        <OfferActions offerId={offer.id} status={offer.status} role={role} />
      </div>
    </div>
  );
}

export function TradeCard({ trade, viewerId }: { trade: NonNullable<ChatMessage["tradeProposal"]>; viewerId: string }) {
  const role = trade.senderId === viewerId ? "sender" : "receiver";
  const cash = trade.status === "COUNTER_OFFER" && trade.counterCash !== null ? trade.counterCash : trade.cashDifference;
  return (
    <div className="w-80 max-w-full rounded-2xl border border-info/30 bg-gradient-to-br from-info/15 to-transparent p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-info">
          <ArrowLeftRight className="size-4" /> Trade proposal
        </span>
        <StatusBadge status={trade.status} label={TRADE_STATUSES.labels[trade.status]} />
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {[trade.offeredVehicle, null, trade.requestedVehicle].map((v, i) =>
          v ? (
            <Link key={i} href={`/vehicles/${v.slug}`} className="min-w-0 text-center">
              <span className="relative mx-auto block aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-2">
                <SafeImage src={v.images[0]?.url ?? ""} alt="" fill sizes="120px" className="object-cover" />
              </span>
              <span className="mt-1 block truncate text-xs font-medium">{vehicleTitle(v)}</span>
            </Link>
          ) : (
            <ArrowLeftRight key={i} className="size-4 text-info" />
          ),
        )}
      </div>
      <p className="mt-2 text-center text-sm font-semibold">
        {formatSignedCash(cash)}
        {trade.status === "COUNTER_OFFER" && <span className="block text-xs font-normal text-muted">Counter offer · from proposer&apos;s side</span>}
      </p>
      <div className="mt-3 empty:hidden">
        <TradeActions tradeId={trade.id} status={trade.status} role={role} />
      </div>
    </div>
  );
}
