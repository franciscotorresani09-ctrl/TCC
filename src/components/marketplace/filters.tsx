"use client";

import { useState } from "react";
import { useSyncedState } from "@/hooks/use-synced-state";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { BODY_TYPES, CATEGORIES, CONDITIONS, FUEL_TYPES, RADIUS_OPTIONS, TRANSMISSIONS } from "@/lib/constants";
import { CITIES, COUNTRIES, US_STATES } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { useFilterNav } from "./use-filter-nav";

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-4 last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-semibold" aria-expanded={open}>
        {title}
        <ChevronDown className={cn("size-4 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function Chips({ name, options, selected, onToggle }: { name: string; options: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
              active ? "border-accent bg-accent-soft text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Number input that commits on blur / Enter to avoid a request per keystroke. */
function NumberFilter({ name, placeholder, value, onCommit, prefix }: { name: string; placeholder: string; value: string; onCommit: (v: string) => void; prefix?: string }) {
  const [local, setLocal] = useSyncedState(value);
  return (
    <Input
      aria-label={placeholder}
      name={name}
      inputMode="numeric"
      placeholder={placeholder}
      value={local}
      icon={prefix ? <span className="text-xs">{prefix}</span> : undefined}
      onChange={(e) => setLocal(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={() => local !== value && onCommit(local)}
      onKeyDown={(e) => e.key === "Enter" && onCommit(local)}
      className="h-10"
    />
  );
}

export function MarketplaceFilters({ makes }: { makes: string[] }) {
  const { params, update, reset } = useFilterNav();
  const list = (k: string) => params.get(k)?.split(",").filter(Boolean) ?? [];
  const toggle = (k: string, v: string) => {
    const cur = list(k);
    update({ [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const get = (k: string) => params.get(k) ?? "";
  const selectedMakes = list("make");
  const [showAllMakes, setShowAllMakes] = useState(false);
  const makeOptions = Array.from(new Set([...makes, ...selectedMakes])).sort();
  const visibleMakes = showAllMakes ? makeOptions : makeOptions.slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-semibold">Filters</h2>
        <button type="button" onClick={() => reset()} className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
          <RotateCcw className="size-3.5" /> Reset
        </button>
      </div>

      <Section title="Vehicle Type">
        <Chips name="Vehicle type" options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))} selected={list("category")} onToggle={(v) => toggle("category", v)} />
      </Section>

      <Section title="Condition">
        <Chips name="Condition" options={CONDITIONS.list} selected={list("condition")} onToggle={(v) => toggle("condition", v)} />
      </Section>

      <Section title="Price">
        <div className="grid grid-cols-2 gap-2">
          <NumberFilter name="minPrice" placeholder="Minimum" prefix="$" value={get("minPrice")} onCommit={(v) => update({ minPrice: v })} />
          <NumberFilter name="maxPrice" placeholder="Maximum" prefix="$" value={get("maxPrice")} onCommit={(v) => update({ maxPrice: v })} />
        </div>
      </Section>

      <Section title="Year">
        <div className="grid grid-cols-2 gap-2">
          <NumberFilter name="minYear" placeholder="Minimum year" value={get("minYear")} onCommit={(v) => update({ minYear: v })} />
          <NumberFilter name="maxYear" placeholder="Maximum year" value={get("maxYear")} onCommit={(v) => update({ maxYear: v })} />
        </div>
      </Section>

      <Section title="Mileage">
        <Select aria-label="Maximum mileage" value={get("maxMileage")} onChange={(e) => update({ maxMileage: e.target.value })} className="h-10">
          <option value="">Any mileage</option>
          {[5000, 10000, 25000, 50000, 75000, 100000, 150000].map((m) => (
            <option key={m} value={m}>
              Under {m.toLocaleString("en-US")} miles
            </option>
          ))}
        </Select>
      </Section>

      <Section title="Make">
        <Chips name="Make" options={visibleMakes.map((m) => ({ value: m, label: m }))} selected={selectedMakes} onToggle={(v) => toggle("make", v)} />
        {makeOptions.length > 10 && (
          <button type="button" onClick={() => setShowAllMakes((s) => !s)} className="mt-3 text-xs font-medium text-accent hover:underline">
            {showAllMakes ? "Show fewer" : `Show all ${makeOptions.length} makes`}
          </button>
        )}
      </Section>

      <Section title="Location">
        <div className="space-y-2">
          <Select aria-label="City" value={get("city")} onChange={(e) => update({ city: e.target.value })} className="h-10">
            <option value="">Any city</option>
            {CITIES.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}, {c.state}
              </option>
            ))}
          </Select>
          <Select aria-label="Distance radius" value={get("radius")} onChange={(e) => update({ radius: e.target.value })} className="h-10" disabled={!get("city")}>
            <option value="">City only</option>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Within {r} miles
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label="State" value={get("state")} onChange={(e) => update({ state: e.target.value })} className="h-10">
              <option value="">Any state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select aria-label="Country" value={get("country")} onChange={(e) => update({ country: e.target.value })} className="h-10">
              <option value="">Any country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Transmission">
        <Chips
          name="Transmission"
          options={TRANSMISSIONS.list}
          selected={get("transmission") ? [get("transmission")] : []}
          onToggle={(v) => update({ transmission: get("transmission") === v ? "" : v })}
        />
      </Section>

      <Section title="Fuel Type">
        <Chips name="Fuel type" options={FUEL_TYPES.list} selected={list("fuelType")} onToggle={(v) => toggle("fuelType", v)} />
      </Section>

      <Section title="Body Type">
        <Chips
          name="Body type"
          options={BODY_TYPES.list.filter((b) => !["MOTORCYCLE", "OTHER", "VAN"].includes(b.value))}
          selected={list("bodyType")}
          onToggle={(v) => toggle("bodyType", v)}
        />
      </Section>
    </div>
  );
}
