"use client";

import { useSyncedState } from "@/hooks/use-synced-state";
import { Search, X } from "lucide-react";
import { useFilterNav } from "./use-filter-nav";

export function MarketplaceSearchBar() {
  const { params, update } = useFilterNav();
  const [q, setQ] = useSyncedState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update({ q: q.trim() });
      }}
      className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15"
    >
      <Search className="ml-2.5 size-5 shrink-0 text-subtle" />
      <label htmlFor="market-q" className="sr-only">
        Search vehicles
      </label>
      <input
        id="market-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder='Try "Porsche under $100,000" or "2020+ Toyota SUV"'
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-subtle focus:outline-none"
        autoComplete="off"
        maxLength={120}
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            update({ q: "" });
          }}
          className="rounded-lg p-2 text-subtle hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
      <button type="submit" className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover active:scale-95">
        Search
      </button>
    </form>
  );
}
