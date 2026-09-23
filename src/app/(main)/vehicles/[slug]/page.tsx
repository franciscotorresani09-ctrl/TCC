import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { BadgeCheck, Calendar, Check, ChevronRight, Cog, Droplet, Eye, Fuel, Gauge, Heart, MapPin, Palette, Car, Route, ShieldCheck, Wrench } from "lucide-react";
import { getSessionUser } from "@/server/auth-guard";
import { getSimilarVehicles, getTradeableVehicles, getVehicleBySlug, incrementVehicleViews } from "@/server/services/vehicles";
import { getFavoriteIds } from "@/server/services/favorites";
import { Gallery } from "@/components/vehicles/gallery";
import { ListingActions } from "@/components/vehicles/listing-actions";
import { ReportButton } from "@/components/vehicles/report-dialog";
import { VehicleGrid } from "@/components/vehicles/vehicle-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating";
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants";
import { absoluteUrl, formatDate, formatNumber, formatPrice, timeAgo, vehicleTitle } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getVehicleBySlug((await params).slug);
  if (!v) return { title: "Listing not found" };
  const title = `${vehicleTitle(v)} for sale in ${v.city}, ${v.state}`;
  const description = `${formatPrice(v.price)} · ${formatNumber(v.mileage)} miles · ${TRANSMISSIONS.labels[v.transmission]} · ${FUEL_TYPES.labels[v.fuelType]}. ${v.description.slice(0, 120)}`;
  const image = v.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${v.slug}` },
    openGraph: { type: "website", title, description, url: `/vehicles/${v.slug}`, images: image ? [{ url: image, width: 1600, height: 1067, alt: title }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
    robots: v.status === "SOLD" ? { index: false } : undefined,
  };
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();

  const user = await getSessionUser();
  const [favs, similar, myVehicles] = await Promise.all([
    getFavoriteIds(user?.id),
    getSimilarVehicles(v),
    user && user.id !== v.sellerId ? getTradeableVehicles(user.id) : Promise.resolve([]),
  ]);
  after(() => incrementVehicleViews(v.id));

  const title = vehicleTitle({ year: v.year, make: v.make, model: v.model });
  const available = v.status === "ACTIVE";
  const specs = [
    { icon: Calendar, label: "Year", value: v.year },
    { icon: Gauge, label: "Mileage", value: `${formatNumber(v.mileage)} mi` },
    { icon: Cog, label: "Transmission", value: TRANSMISSIONS.labels[v.transmission] },
    { icon: Fuel, label: "Fuel type", value: FUEL_TYPES.labels[v.fuelType] },
    { icon: Wrench, label: "Engine", value: v.engine },
    { icon: Route, label: "Drivetrain", value: DRIVETRAINS.labels[v.drivetrain] },
    { icon: Car, label: "Body type", value: BODY_TYPES.labels[v.bodyType] },
    { icon: ShieldCheck, label: "Condition", value: CONDITIONS.labels[v.condition] },
    ...(v.exteriorColor ? [{ icon: Palette, label: "Exterior", value: v.exteriorColor }] : []),
    ...(v.interiorColor ? [{ icon: Droplet, label: "Interior", value: v.interiorColor }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    name: vehicleTitle(v),
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage, unitCode: "SMI" },
    fuelType: FUEL_TYPES.labels[v.fuelType],
    vehicleTransmission: TRANSMISSIONS.labels[v.transmission],
    vehicleEngine: { "@type": "EngineSpecification", name: v.engine },
    bodyType: BODY_TYPES.labels[v.bodyType],
    color: v.exteriorColor ?? undefined,
    itemCondition: v.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    image: v.images.map((i) => i.url),
    description: v.description,
    url: absoluteUrl(`/vehicles/${v.slug}`),
    offers: {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "USD",
      availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@type": v.seller.sellerType === "DEALER" ? "AutoDealer" : "Person", name: v.seller.name },
    },
  };

  const tradeTarget = { id: v.id, title: vehicleTitle(v), price: v.price, image: v.images[0]?.url };
  const mine = myVehicles.map((m) => ({ id: m.id, title: vehicleTitle(m), price: m.price, image: m.images[0]?.url }));

  return (
    <div className="container-page pb-32 pt-4 sm:pt-8 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-4 hidden items-center gap-1.5 text-sm text-subtle sm:flex">
        <Link href="/marketplace" className="hover:text-fg">
          Marketplace
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/marketplace?category=${v.category.slug}`} className="hover:text-fg">
          {v.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/marketplace?make=${encodeURIComponent(v.make)}`} className="hover:text-fg">
          {v.make}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-muted">{title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <Gallery images={v.images} title={vehicleTitle(v)} />

          {/* Mobile title block */}
          <div className="mt-5 lg:hidden">
            <TitleBlock v={v} title={title} />
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border bg-surface p-4">
                  <dt className="flex items-center gap-1.5 text-xs text-subtle">
                    <Icon className="size-3.5" /> {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{v.description}</p>
          </section>

          {v.features.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {v.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm">
                    <Check className="size-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" /> {formatNumber(v.views)} views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-3.5" /> {v._count.favorites} saves
            </span>
            <span>Listed {timeAgo(v.createdAt)}</span>
            {v.vin && <span>VIN {v.vin}</span>}
            <ReportButton target={{ vehicleId: v.id }} className="ml-auto" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <div className="hidden lg:block">
              <TitleBlock v={v} title={title} />
              <div className="my-5 h-px bg-border" />
            </div>
            <ListingActions
              vehicle={tradeTarget}
              sellerId={v.sellerId}
              sellerName={v.seller.name ?? "the seller"}
              favorited={favs.vehicles.has(v.id)}
              myVehicles={mine}
              available={available}
              openToTrade={v.openToTrade}
            />
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Seller</p>
            <Link href={v.seller.username ? `/u/${v.seller.username}` : "#"} className="group mt-3 flex items-center gap-3">
              <Avatar src={v.seller.image} name={v.seller.name} size="lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold group-hover:underline">
                  <span className="truncate">{v.seller.name}</span>
                  {v.seller.sellerType === "DEALER" && <BadgeCheck className="size-4 shrink-0 text-info" />}
                </p>
                <p className="text-sm text-muted">{v.seller.sellerType === "DEALER" ? "Dealership" : "Private seller"}</p>
              </div>
            </Link>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-2 p-2.5">
                <p className="flex items-center justify-center gap-1 font-semibold">{v.sellerRating ? v.sellerRating.toFixed(1) : "—"}</p>
                {v.sellerRating ? <RatingStars value={v.sellerRating} className="justify-center" /> : <p className="text-[11px] text-subtle">No rating</p>}
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5">
                <p className="font-semibold">{v.seller._count.vehicles}</p>
                <p className="text-[11px] text-subtle">Listings</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-2.5">
                <p className="font-semibold">{v.seller._count.reviewsReceived}</p>
                <p className="text-[11px] text-subtle">Reviews</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-subtle">Member since {formatDate(v.seller.createdAt, { day: undefined })}</p>
            {v.seller.username && (
              <Link href={`/u/${v.seller.username}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                View seller profile <ChevronRight className="size-4" />
              </Link>
            )}
          </div>

          <div className="flex gap-3 rounded-2xl border border-border bg-surface-2/50 p-4 text-xs text-muted">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            <p>
              Stay safe: meet in public places, inspect the vehicle and title before paying, and never wire money to someone you haven&apos;t met.{" "}
              <Link href="/safety" className="text-fg underline">
                Safety tips
              </Link>
            </p>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Similar vehicles</h2>
          <VehicleGrid vehicles={similar} favoriteIds={favs.vehicles} />
        </section>
      )}

      {/* Sticky mobile CTA */}
      {available && user?.id !== v.sellerId && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur-xl md:bottom-0 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{title}</p>
              <p className="text-lg font-bold">{formatPrice(v.price)}</p>
            </div>
            <ListingActions
              compact
              vehicle={tradeTarget}
              sellerId={v.sellerId}
              sellerName={v.seller.name ?? "the seller"}
              favorited={favs.vehicles.has(v.id)}
              myVehicles={mine}
              available={available}
              openToTrade={v.openToTrade}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TitleBlock({ v, title }: { v: NonNullable<Awaited<ReturnType<typeof getVehicleBySlug>>>; title: string }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {v.status === "SOLD" && <Badge tone="accent">Sold</Badge>}
        {v.status === "PAUSED" && <Badge>Paused</Badge>}
        {v.isFeatured && <Badge tone="accent">Featured</Badge>}
        <Badge>{CONDITIONS.labels[v.condition]}</Badge>
        {v.openToTrade && <Badge tone="info">Open to trades</Badge>}
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {v.trim && <p className="mt-0.5 text-muted">{v.trim}</p>}
      <p className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{formatPrice(v.price)}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4" /> {v.city}, {v.state}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="size-4" /> {formatNumber(v.mileage)} miles
        </span>
      </div>
    </div>
  );
}
