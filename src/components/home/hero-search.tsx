"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const EXAMPLES = ["Porsche under $100,000", "2020+ Toyota SUV", "Ford Mustang in Miami", "Manual coupe under 40k"];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const go = (query: string) => router.push(query ? `/marketplace?q=${encodeURIComponent(query)}` : "/marketplace");

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q.trim());
        }}
        role="search"
        className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-black/50 p-2 shadow-2xl backdrop-blur-xl transition focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/15"
      >
        <Search className="ml-2 size-5 shrink-0 text-muted" />
        <label htmlFor="hero-search" className="sr-only">
          Search vehicles
        </label>
        <input
          id="hero-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make, model, price, or city…"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none"
          autoComplete="off"
        />
        <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover active:scale-95 sm:px-5">
          <span className="hidden sm:inline">Search</span>
          <ArrowRight className="size-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-subtle">
          <Sparkles className="size-3.5 text-accent" /> Try:
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => go(ex)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted backdrop-blur transition hover:border-white/20 hover:text-fg"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
