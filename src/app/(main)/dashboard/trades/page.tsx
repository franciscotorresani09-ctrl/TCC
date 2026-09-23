import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { listTrades } from "@/server/services/deals";
import { LinkTabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { SafeImage } from "@/components/ui/safe-image";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { TradeActions } from "@/components/offers/deal-actions";
import { TRADE_STATUSES } from "@/lib/constants";
import { formatPrice, formatSignedCash, timeAgo, vehicleTitle } from "@/lib/utils";

export default async function TradesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUserPage("/dashboard/trades");
  const tab = (await searchParams).tab === "outgoing" ? "outgoing" : "incoming";
  const trades = await listTrades(user.id);
  const list = trades[tab];

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold">Trade proposals</h2>
      <LinkTabs
        active={tab}
        tabs={[
          { value: "incoming", label: "Received", href: "/dashboard/trades", count: trades.incoming.length },
          { value: "outgoing", label: "Sent", href: "/dashboard/trades?tab=outgoing", count: trades.outgoing.length },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.length ? (
          list.map((t) => {
            const other = tab === "incoming" ? t.sender : t.receiver;
            const cash = t.status === "COUNTER_OFFER" && t.counterCash !== null ? t.counterCash : t.cashDifference;
            return (
              <div key={t.id} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Avatar src={other.image} name={other.name} size="sm" />
                    <span>
                      {tab === "incoming" ? "From" : "To"} <span className="font-medium text-fg">{other.name}</span> · {timeAgo(t.updatedAt)}
                    </span>
                  </div>
                  <StatusBadge status={t.status} label={TRADE_STATUSES.labels[t.status]} />
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {[
                    { v: t.offeredVehicle, label: tab === "incoming" ? "They offer" : "You offer" },
                    null,
                    { v: t.requestedVehicle, label: tab === "incoming" ? "For your" : "For their" },
                  ].map((item, i) =>
                    item ? (
                      <Link key={i} href={`/vehicles/${item.v.slug}`} className="group min-w-0">
                        <p className="mb-1.5 text-xs text-subtle">{item.label}</p>
                        <span className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
                          <SafeImage src={item.v.images[0]?.url ?? ""} alt="" fill sizes="(min-width: 640px) 280px, 40vw" className="object-cover transition group-hover:scale-105" />
                        </span>
                        <p className="mt-2 truncate text-sm font-medium">{vehicleTitle(item.v)}</p>
                        <p className="text-xs text-muted">{formatPrice(item.v.price)}</p>
                      </Link>
                    ) : (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="flex size-10 items-center justify-center rounded-full bg-info/15">
                          <ArrowLeftRight className="size-5 text-info" />
                        </span>
                        <span className="text-center text-xs font-semibold">{formatSignedCash(cash)}</span>
                      </div>
                    ),
                  )}
                </div>
                {t.status === "COUNTER_OFFER" && <p className="mt-3 text-xs text-info">Counter offer — cash shown from the proposer&apos;s side.</p>}
                {t.message && <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">“{t.message}”</p>}
                <div className="mt-4 empty:hidden">
                  <TradeActions tradeId={t.id} status={t.status} role={tab === "incoming" ? "receiver" : "sender"} />
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title={tab === "incoming" ? "No trade proposals yet" : "You haven't proposed any trades"}
            description={tab === "incoming" ? "When someone offers their vehicle for one of yours, it will appear here." : "Find a listing that's open to trades and propose a swap."}
            action={tab === "outgoing" ? <ButtonLink href="/marketplace">Browse vehicles</ButtonLink> : undefined}
          />
        )}
      </div>
    </div>
  );
}
