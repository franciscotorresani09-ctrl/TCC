import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Car, CircleDollarSign, Eye, Heart, MessageCircle, PartyPopper, Tag } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { getDashboardOverview } from "@/server/services/dashboard";
import { getSellerListings } from "@/server/services/vehicles";
import { listConversations } from "@/server/services/messages";
import { listOffers, listTrades } from "@/server/services/deals";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { OFFER_STATUSES, TRADE_STATUSES } from "@/lib/constants";
import { formatCompact, formatPrice, formatSignedCash, timeAgo, vehicleTitle } from "@/lib/utils";

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUserPage("/dashboard");
  const { welcome } = await searchParams;
  const [o, listings, conversations, offers, trades] = await Promise.all([
    getDashboardOverview(user.id),
    getSellerListings(user.id),
    listConversations(user.id),
    listOffers(user.id),
    listTrades(user.id),
  ]);

  const stats = [
    { label: "Active listings", value: o.activeListings, icon: Car, href: "/dashboard/listings" },
    { label: "Total views", value: formatCompact(o.views), icon: Eye, href: "/dashboard/listings" },
    { label: "Favorites", value: o.favorites, icon: Heart, href: "/dashboard/listings" },
    { label: "Unread messages", value: o.unreadMessages, icon: MessageCircle, href: "/messages" },
    { label: "Pending offers", value: o.pendingOffers, icon: CircleDollarSign, href: "/dashboard/offers" },
    { label: "Trade proposals", value: o.pendingTrades, icon: ArrowLeftRight, href: "/dashboard/trades" },
  ];
  const maxViews = Math.max(1, ...listings.map((l) => l.views));

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="flex items-center gap-4 rounded-3xl border border-accent/30 bg-accent-soft p-5 animate-fade-up">
          <PartyPopper className="size-8 shrink-0 text-accent" />
          <div className="flex-1">
            <p className="font-semibold">Welcome to Street-Car!</p>
            <p className="text-sm text-muted">Your account is ready. List a vehicle, explore the marketplace, or find a meet near you.</p>
          </div>
          <ButtonLink href="/sell" size="sm">
            List a vehicle
          </ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, href }, i) => (
          <Link key={label} href={href} className="group rounded-2xl border border-border bg-surface p-4 transition hover:border-border-strong animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <Icon className="size-5 text-accent" />
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Listing performance" description="Views per active listing" action={<Link href="/dashboard/listings" className="text-sm text-accent hover:underline">Manage</Link>} />
          <div className="p-5">
            {listings.length ? (
              <ul className="space-y-3">
                {listings.slice(0, 6).map((l) => (
                  <li key={l.id}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <Link href={`/vehicles/${l.slug}`} className="truncate hover:underline">
                        {vehicleTitle(l)}
                      </Link>
                      <span className="shrink-0 text-muted">
                        {l.views} views · {l._count.favorites} saves
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent-gradient" style={{ width: `${(l.views / maxViews) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Tag} title="No listings yet" description="List your first vehicle to start tracking views and saves." action={<ButtonLink href="/sell" size="sm">Sell Your Vehicle</ButtonLink>} className="border-none py-8" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent messages" action={<Link href="/messages" className="text-sm text-accent hover:underline">Open inbox</Link>} />
          <ul className="divide-y divide-border">
            {conversations.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2">
                  <Avatar src={c.other?.image} name={c.other?.name} size="sm" online={c.other?.online} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.other?.name}</p>
                    <p className="truncate text-xs text-muted">{c.lastMessage?.content ?? "No messages yet"}</p>
                  </div>
                  {c.unread > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                  <span className="text-[11px] text-subtle">{timeAgo(c.lastMessageAt)}</span>
                </Link>
              </li>
            ))}
            {!conversations.length && <li className="px-5 py-8 text-center text-sm text-muted">No messages yet. Start a conversation with a seller to get things moving.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Latest offers" action={<Link href="/dashboard/offers" className="text-sm text-accent hover:underline">View all</Link>} />
          <ul className="divide-y divide-border">
            {[...offers.incoming, ...offers.outgoing]
              .sort((a, b) => +b.updatedAt - +a.updatedAt)
              .slice(0, 4)
              .map((of) => (
                <li key={of.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <SafeImage src={of.vehicle.images[0]?.url ?? ""} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{vehicleTitle(of.vehicle)}</p>
                    <p className="text-xs text-muted">
                      {of.seller.id === user.id ? `From ${of.buyer.name}` : "Your offer"} · {formatPrice(of.amount)}
                    </p>
                  </div>
                  <StatusBadge status={of.status} label={OFFER_STATUSES.labels[of.status]} />
                </li>
              ))}
            {!offers.incoming.length && !offers.outgoing.length && <li className="px-5 py-8 text-center text-sm text-muted">No offers yet.</li>}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Trade proposals" action={<Link href="/dashboard/trades" className="text-sm text-accent hover:underline">View all</Link>} />
          <ul className="divide-y divide-border">
            {[...trades.incoming, ...trades.outgoing]
              .sort((a, b) => +b.updatedAt - +a.updatedAt)
              .slice(0, 4)
              .map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <ArrowLeftRight className="size-5 shrink-0 text-info" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {vehicleTitle(t.offeredVehicle)} ⇄ {vehicleTitle(t.requestedVehicle)}
                    </p>
                    <p className="text-xs text-muted">{formatSignedCash(t.cashDifference)}</p>
                  </div>
                  <StatusBadge status={t.status} label={TRADE_STATUSES.labels[t.status]} />
                </li>
              ))}
            {!trades.incoming.length && !trades.outgoing.length && (
              <li className="px-5 py-8 text-center text-sm text-muted">
                No trades yet.{" "}
                <Link href="/marketplace" className="text-accent hover:underline">
                  Find a vehicle to trade for <ArrowRight className="inline size-3.5" />
                </Link>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
