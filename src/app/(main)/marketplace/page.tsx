import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { parseFilters, countActiveFilters, filtersToSearchParams } from "@/lib/search/filters";
import { getMakesInUse, searchVehicles, categoryName } from "@/server/services/vehicles";
import { getFavoriteIds } from "@/server/services/favorites";
import { getSessionUser } from "@/server/auth-guard";
import { MarketplaceSearchBar } from "@/components/marketplace/search-bar";
import { MarketplaceFilters } from "@/components/marketplace/filters";
import { MarketplaceToolbar } from "@/components/marketplace/toolbar";
import { MarketplaceResults } from "@/components/marketplace/results";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const subject = f.make?.join(", ") ?? (f.category?.length ? f.category.map(categoryName).join(", ") : "Vehicles");
  const where = f.city ? ` in ${f.city}` : "";
  const title = f.q ? `“${f.q}” — search results` : `${subject} for sale${where}`;
  const canonical = `/marketplace${filtersToSearchParams({ category: f.category, make: f.make, city: f.city }).size ? `?${filtersToSearchParams({ category: f.category, make: f.make, city: f.city })}` : ""}`;
  return {
    title,
    description: `Browse ${subject.toLowerCase()} for sale${where} on Street-Car. Filter by price, year, mileage, and more, and message sellers directly.`,
    alternates: { canonical },
  };
}

export default async function MarketplacePage({ searchParams }: Props) {
  const raw = await searchParams;
  const filters = parseFilters(raw);
  const user = await getSessionUser();
  const [result, makes, favs] = await Promise.all([searchVehicles(filters), getMakesInUse(), getFavoriteIds(user?.id)]);
  const view = raw.view === "list" ? "list" : "grid";
  const query = filtersToSearchParams(filters).toString();

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Marketplace</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">Cars, motorcycles, trucks, and more from sellers and dealers near you.</p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 bg-bg/85 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Suspense>
          <MarketplaceSearchBar />
        </Suspense>
      </div>

      {result.understood.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs animate-fade-in">
          <span className="inline-flex items-center gap-1 text-subtle">
            <Sparkles className="size-3.5 text-accent" /> Showing results for
          </span>
          {result.understood.map((u) => (
            <span key={u} className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 font-medium text-fg">
              {u}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5 scrollbar-none">
            <Suspense>
              <MarketplaceFilters makes={makes} />
            </Suspense>
          </div>
        </aside>

        <section aria-label="Results">
          <div className="mb-4">
            <Suspense>
              <MarketplaceToolbar total={result.total} activeFilters={countActiveFilters(filters)} makes={makes} />
            </Suspense>
          </div>
          <MarketplaceResults
            key={`${query}|${view}`}
            initialItems={result.items}
            initialFavorites={result.items.filter((i) => favs.vehicles.has(i.id)).map((i) => i.id)}
            pageCount={result.pageCount}
            query={query}
            view={view}
          />
        </section>
      </div>
    </div>
  );
}
