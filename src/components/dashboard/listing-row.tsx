"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CheckCircle2, Eye, Heart, MessageCircle, MoreHorizontal, Pause, Pencil, Play, Trash2, ArrowLeftRight, CircleDollarSign } from "lucide-react";
import type { SellerListing } from "@/server/services/vehicles";
import { SafeImage } from "@/components/ui/safe-image";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/hooks/use-action";
import { deleteVehicleAction, setVehicleStatusAction } from "@/server/actions/vehicles";
import { LISTING_STATUSES } from "@/lib/constants";
import { formatDate, formatNumber, formatPrice, vehicleTitle } from "@/lib/utils";

type Listing = Omit<SellerListing, "createdAt" | "updatedAt"> & { createdAt: Date | string; updatedAt: Date | string };

export function ListingRow({ listing: l }: { listing: Listing }) {
  const router = useRouter();
  const { pending, execute } = useAction();
  const [dialog, setDialog] = useState<"delete" | "sold" | "stats" | null>(null);

  const status = (s: "ACTIVE" | "PAUSED" | "SOLD") =>
    execute(() => setVehicleStatusAction(l.id, s), {
      onSuccess: () => {
        setDialog(null);
        router.refresh();
      },
    });

  const stats = [
    { icon: Eye, label: "Views", value: formatNumber(l.views) },
    { icon: Heart, label: "Favorites", value: l._count.favorites },
    { icon: MessageCircle, label: "Conversations", value: l._count.conversations },
    { icon: CircleDollarSign, label: "Offers", value: l._count.offers },
    { icon: ArrowLeftRight, label: "Trade requests", value: l._count.tradesRequested },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-3 transition hover:border-border-strong sm:flex-row sm:items-center">
      <Link href={`/vehicles/${l.slug}`} className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:aspect-[4/3] sm:w-36">
        <SafeImage src={l.images[0]?.url ?? ""} alt={vehicleTitle(l)} fill sizes="160px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/vehicles/${l.slug}`} className="truncate font-semibold hover:underline">
            {vehicleTitle(l)}
          </Link>
          <StatusBadge status={l.status} label={LISTING_STATUSES.labels[l.status]} />
        </div>
        <p className="mt-0.5 text-lg font-bold">{formatPrice(l.price)}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {stats.slice(0, 4).map(({ icon: Icon, label, value }) => (
            <span key={label} className="inline-flex items-center gap-1" title={label}>
              <Icon className="size-3.5" /> {value}
            </span>
          ))}
          <span>Listed {formatDate(l.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-stretch lg:flex-row lg:items-center">
        <Button variant="outline" size="sm" onClick={() => setDialog("stats")} className="flex-1 sm:flex-none">
          <BarChart3 className="size-4" /> Statistics
        </Button>
        <Menu
          trigger={() => (
            <Button variant="secondary" size="icon-sm" aria-label="Listing actions" disabled={pending}>
              <MoreHorizontal className="size-4" />
            </Button>
          )}
        >
          <MenuItem icon={<Pencil />} onClick={() => router.push(`/sell?edit=${l.id}`)}>
            Edit listing
          </MenuItem>
          {l.status === "ACTIVE" && (
            <MenuItem icon={<Pause />} onClick={() => status("PAUSED")}>
              Pause listing
            </MenuItem>
          )}
          {l.status === "PAUSED" && (
            <MenuItem icon={<Play />} onClick={() => status("ACTIVE")}>
              Resume listing
            </MenuItem>
          )}
          {l.status !== "SOLD" && (
            <MenuItem icon={<CheckCircle2 />} onClick={() => setDialog("sold")}>
              Mark as sold
            </MenuItem>
          )}
          {l.status === "SOLD" && (
            <MenuItem icon={<Play />} onClick={() => status("ACTIVE")}>
              Relist
            </MenuItem>
          )}
          <MenuItem icon={<Trash2 />} danger onClick={() => setDialog("delete")}>
            Delete listing
          </MenuItem>
        </Menu>
      </div>

      <ConfirmDialog
        open={dialog === "sold"}
        onClose={() => setDialog(null)}
        onConfirm={() => status("SOLD")}
        loading={pending}
        title="Mark as sold?"
        description="The listing will be hidden from search, pending offers will be declined, and people who saved it will be notified."
        confirmLabel="Mark as sold"
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        onConfirm={() => execute(() => deleteVehicleAction(l.id), { onSuccess: () => { setDialog(null); router.refresh(); } })}
        loading={pending}
        danger
        title="Delete this listing?"
        description="This permanently removes the listing from Street-Car. Conversations about it will be kept. This can't be undone."
        confirmLabel="Delete listing"
      />
      <Modal open={dialog === "stats"} onClose={() => setDialog(null)} title="Listing statistics" description={vehicleTitle(l)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface-2 p-4">
              <Icon className="size-4 text-accent" />
              <p className="mt-2 text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs text-muted">Save rate</p>
            <p className="mt-2 text-2xl font-bold">{l.views ? ((l._count.favorites / l.views) * 100).toFixed(1) : "0.0"}%</p>
            <p className="text-xs text-muted">of viewers saved it</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-subtle">Last updated {formatDate(l.updatedAt)}</p>
      </Modal>
    </div>
  );
}
