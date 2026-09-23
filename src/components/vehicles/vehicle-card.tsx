import Link from "next/link";
import { ArrowLeftRight, Gauge, MapPin, Fuel, Cog, BadgeCheck } from "lucide-react";
import type { VehicleCardData } from "@/server/services/vehicles";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";
import { FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";
import { cn, formatNumber, formatPrice, isRecent } from "@/lib/utils";

type CardVehicle = Omit<VehicleCardData, "createdAt"> & { createdAt: Date | string };

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function VehicleCard({
  vehicle: v,
  favorited = false,
  layout = "grid",
  priority,
  className,
}: {
  vehicle: CardVehicle;
  favorited?: boolean;
  layout?: "grid" | "list";
  priority?: boolean;
  className?: string;
}) {
  const image = v.images[0];
  const isNew = isRecent(v.createdAt, NEW_WINDOW_MS);
  const title = `${v.year} ${v.make} ${v.model}`;
  const dealer = v.seller.sellerType === "DEALER";

  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.9)]",
        layout === "grid" ? "flex-col" : "flex-col sm:flex-row",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden bg-surface-2", layout === "grid" ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-auto sm:w-80 sm:shrink-0")}>
        <SafeImage
          src={image?.url ?? ""}
          alt={image?.alt ?? title}
          fill
          priority={priority}
          sizes={layout === "grid" ? "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "320px"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {v.isFeatured && <Badge tone="accent" className="border-accent/40 bg-accent text-white">Featured</Badge>}
          {isNew && <Badge tone="glass">New listing</Badge>}
          {v.status === "SOLD" && <Badge tone="glass">Sold</Badge>}
        </div>
        <div className="absolute right-3 top-3">
          <FavoriteButton targetId={v.id} initial={favorited} />
        </div>
        {v.openToTrade && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <ArrowLeftRight className="size-3" /> Open to trades
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight">{title}</h3>
            <p className="truncate text-sm text-muted">{v.trim ?? " "}</p>
          </div>
        </div>
        <p className="-mt-2 text-xl font-bold tracking-tight">{formatPrice(v.price)}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3.5" /> {formatNumber(v.mileage)} mi
          </span>
          <span className="inline-flex items-center gap-1">
            <Cog className="size-3.5" /> {TRANSMISSIONS.labels[v.transmission]}
          </span>
          <span className="inline-flex items-center gap-1">
            <Fuel className="size-3.5" /> {FUEL_TYPES.labels[v.fuelType]}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1 text-muted">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {v.city}, {v.state}
            </span>
          </span>
          <span className={cn("inline-flex shrink-0 items-center gap-1 font-medium", dealer ? "text-info" : "text-muted")}>
            {dealer && <BadgeCheck className="size-3.5" />}
            {dealer ? "Dealer" : "Private seller"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function VehicleGrid({
  vehicles,
  favoriteIds,
  className,
}: {
  vehicles: CardVehicle[];
  favoriteIds?: Set<string> | string[];
  className?: string;
}) {
  const favs = favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds ?? []);
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {vehicles.map((v, i) => (
        <div key={v.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <VehicleCard vehicle={v} favorited={favs.has(v.id)} priority={i < 4} className="h-full" />
        </div>
      ))}
    </div>
  );
}
