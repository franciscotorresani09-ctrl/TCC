import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarHeart, Heart, Users } from "lucide-react";
import { requireUserPage } from "@/server/auth-guard";
import { listFavorites } from "@/server/services/favorites";
import { VehicleGrid } from "@/components/vehicles/vehicle-card";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { LinkTabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/vehicles/favorite-button";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUserPage("/favorites");
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "events" || rawTab === "sellers" ? rawTab : "vehicles";
  const favs = await listFavorites(user.id);

  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Favorites</h1>
      <p className="mt-1 text-muted">Everything you&apos;ve saved, in one place.</p>
      <LinkTabs
        className="mt-6"
        active={tab}
        tabs={[
          { value: "vehicles", label: "Vehicles", href: "/favorites", count: favs.vehicles.length },
          { value: "events", label: "Events", href: "/favorites?tab=events", count: favs.events.length },
          { value: "sellers", label: "Sellers", href: "/favorites?tab=sellers", count: favs.sellers.length },
        ]}
      />
      <div className="mt-6">
        {tab === "vehicles" &&
          (favs.vehicles.length ? (
            <VehicleGrid vehicles={favs.vehicles} favoriteIds={favs.vehicles.map((v) => v.id)} />
          ) : (
            <EmptyState icon={Heart} title="No favorites yet" description="Save vehicles you love and find them here later." action={<ButtonLink href="/marketplace">Explore Marketplace</ButtonLink>} />
          ))}
        {tab === "events" &&
          (favs.events.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favs.events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarHeart} title="No saved events" description="Save events you're interested in to keep track of them here." action={<ButtonLink href="/events">Discover events</ButtonLink>} />
          ))}
        {tab === "sellers" &&
          (favs.sellers.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favs.sellers.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
                  <Avatar src={s.image} name={s.name} size="lg" />
                  <Link href={s.username ? `/u/${s.username}` : "#"} className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate font-semibold hover:underline">
                      {s.name} {s.sellerType === "DEALER" && <BadgeCheck className="size-4 text-info" />}
                    </p>
                    <p className="text-sm text-muted">
                      {[s.city, s.state].filter(Boolean).join(", ")} · {s._count.vehicles} listings
                    </p>
                  </Link>
                  <FavoriteButton kind="seller" targetId={s.id} initial variant="glass" className="bg-surface-2" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No saved sellers" description="Save sellers and dealerships you trust to see their new listings first." />
          ))}
      </div>
    </div>
  );
}
