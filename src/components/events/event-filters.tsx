"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { EVENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();
  const type = params.get("type") ?? "";

  const update = (changes: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    start(() => router.replace(`${pathname}?${sp}`, { scroll: false }));
  };

  return (
    <div className={cn("space-y-4 transition-opacity", pending && "opacity-70")}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
        className="flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 focus-within:border-accent"
      >
        <Search className="ml-2.5 size-5 text-subtle" />
        <input
          aria-label="Search events"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events or cities"
          className="h-10 flex-1 bg-transparent text-[15px] placeholder:text-subtle focus:outline-none"
          maxLength={80}
        />
        <button className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover">Search</button>
      </form>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Event type">
        {[{ value: "", label: "All events" }, ...EVENT_TYPES.list].map((t) => (
          <button
            key={t.value}
            onClick={() => update({ type: t.value })}
            aria-pressed={type === t.value}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95",
              type === t.value ? "border-accent bg-accent text-white" : "border-border text-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
