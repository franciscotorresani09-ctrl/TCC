"use client";

import { useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFilterNav } from "./use-filter-nav";
import { MarketplaceFilters } from "./filters";

export function MarketplaceToolbar({ total, activeFilters, makes }: { total: number; activeFilters: number; makes: string[] }) {
  const { params, update, pending } = useFilterNav();
  const [sheet, setSheet] = useState(false);
  const view = params.get("view") === "list" ? "list" : "grid";

  return (
    <div className="flex items-center gap-2">
      <p className="mr-auto text-sm text-muted" aria-live="polite">
        {pending ? "Updating…" : <><span className="font-semibold text-fg">{total.toLocaleString("en-US")}</span> {total === 1 ? "vehicle" : "vehicles"}</>}
      </p>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheet(true)}>
        <SlidersHorizontal className="size-4" /> Filters
        {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">{activeFilters}</span>}
      </Button>
      <label htmlFor="sort" className="sr-only">
        Sort by
      </label>
      <Select id="sort" value={params.get("sort") ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} className="h-9 w-auto min-w-40 rounded-lg text-xs sm:text-sm">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <div className="hidden rounded-lg border border-border p-0.5 sm:flex" role="group" aria-label="Layout">
        {(["grid", "list"] as const).map((v) => {
          const Icon = v === "grid" ? LayoutGrid : List;
          return (
            <button
              key={v}
              onClick={() => update({ view: v === "grid" ? "" : v })}
              aria-pressed={view === v}
              aria-label={v === "grid" ? "Grid view" : "List view"}
              className={cn("rounded-md p-1.5 transition", view === v ? "bg-elevated text-fg" : "text-subtle hover:text-fg")}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>

      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        footer={
          <Button onClick={() => setSheet(false)} className="w-full" loading={pending}>
            Show {total.toLocaleString("en-US")} results
          </Button>
        }
      >
        <MarketplaceFilters makes={makes} />
      </Modal>
    </div>
  );
}
