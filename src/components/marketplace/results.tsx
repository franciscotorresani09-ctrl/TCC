"use client";

import { useEffect, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import type { VehicleCardData } from "@/server/services/vehicles";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { VehicleCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = Omit<VehicleCardData, "createdAt"> & { createdAt: string | Date };

/**
 * Infinite-scrolling results. First page is server-rendered; later pages stream from /api/vehicles.
 * The parent keys this component by the query so state resets when filters change.
 */
export function MarketplaceResults({
  initialItems,
  initialFavorites,
  pageCount,
  query,
  view,
}: {
  initialItems: Item[];
  initialFavorites: string[];
  pageCount: number;
  query: string;
  view: "grid" | "list";
}) {
  const [items, setItems] = useState(initialItems);
  const [favorites, setFavorites] = useState(new Set(initialFavorites));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const hasMore = page < pageCount;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const sp = new URLSearchParams(query);
      sp.set("page", String(page + 1));
      const res = await fetch(`/api/vehicles?${sp.toString()}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Item[]; favoriteIds: string[] };
      setItems((prev) => [...prev, ...data.items.filter((d) => !prev.some((p) => p.id === d.id))]);
      setFavorites((prev) => new Set([...prev, ...data.favoriteIds]));
      setPage((p) => p + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  });

  if (!items.length) {
    return <EmptyState icon={SearchX} title="No listings found" description="Try adjusting your filters or search criteria." />;
  }

  return (
    <>
      <div className={cn("grid gap-4", view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
        {items.map((v, i) => (
          <div key={v.id} className="animate-fade-up" style={{ animationDelay: `${(i % 12) * 30}ms` }}>
            <VehicleCard vehicle={v} favorited={favorites.has(v.id)} layout={view} priority={i < 3} className="h-full" />
          </div>
        ))}
        {loading && Array.from({ length: view === "grid" ? 3 : 2 }, (_, i) => <VehicleCardSkeleton key={`s${i}`} />)}
      </div>
      <div ref={sentinel} className="h-px" />
      {error && (
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-muted">
          Unable to load more listings.
          <Button variant="outline" size="sm" onClick={loadMore}>
            Try again
          </Button>
        </div>
      )}
      {!hasMore && items.length > 6 && <p className="mt-10 text-center text-sm text-subtle">You&apos;ve reached the end of the results.</p>}
    </>
  );
}
