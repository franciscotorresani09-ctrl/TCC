import { z } from "zod";
import {
  BODY_TYPES,
  CATEGORIES,
  CONDITIONS,
  FUEL_TYPES,
  SORT_OPTIONS,
  TRANSMISSIONS,
  type BodyTypeValue,
  type Condition,
  type FuelTypeValue,
  type SortValue,
  type TransmissionValue,
} from "@/lib/constants";

export interface MarketplaceFilters {
  q?: string;
  category?: string[];
  condition?: Condition[];
  make?: string[];
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  city?: string;
  state?: string;
  country?: string;
  radius?: number;
  transmission?: TransmissionValue;
  fuelType?: FuelTypeValue[];
  bodyType?: BodyTypeValue[];
  sort: SortValue;
  page: number;
}

const csv = <T extends string>(allowed?: readonly T[]) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const parts = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const valid = allowed ? parts.filter((p): p is T => (allowed as readonly string[]).includes(p)) : (parts as T[]);
      return valid.length ? valid : undefined;
    });

const int = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = Number.parseInt(v.replace(/[^0-9-]/g, ""), 10);
      return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
    });

const text = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim().slice(0, max) : undefined));

const schema = z.object({
  q: text(120),
  category: csv(CATEGORIES.map((c) => c.slug)),
  condition: csv(CONDITIONS.values),
  make: csv<string>(),
  model: text(60),
  minPrice: int(0, 100_000_000),
  maxPrice: int(0, 100_000_000),
  minYear: int(1900, 2100),
  maxYear: int(1900, 2100),
  maxMileage: int(0, 2_000_000),
  city: text(60),
  state: text(40),
  country: text(60),
  radius: int(1, 1000),
  transmission: z
    .string()
    .optional()
    .transform((v) => (TRANSMISSIONS.values as readonly string[]).includes(v ?? "") ? (v as TransmissionValue) : undefined),
  fuelType: csv(FUEL_TYPES.values),
  bodyType: csv(BODY_TYPES.values),
  sort: z
    .string()
    .optional()
    .transform((v) => (SORT_OPTIONS.some((o) => o.value === v) ? (v as SortValue) : "newest")),
  page: int(1, 500).transform((v) => v ?? 1),
});

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseFilters(params: RawParams): MarketplaceFilters {
  const flat: Record<string, string | undefined> = {};
  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => (flat[key] = value));
  } else {
    for (const [key, value] of Object.entries(params)) flat[key] = Array.isArray(value) ? value.join(",") : value;
  }
  return schema.parse(flat) as MarketplaceFilters;
}

export function filtersToSearchParams(filters: Partial<MarketplaceFilters>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && value === 1) continue;
    if (key === "sort" && value === "newest") continue;
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(","));
    } else sp.set(key, String(value));
  }
  return sp;
}

export function countActiveFilters(f: MarketplaceFilters) {
  const keys: (keyof MarketplaceFilters)[] = [
    "category", "condition", "make", "minPrice", "maxPrice", "minYear", "maxYear", "maxMileage",
    "city", "state", "country", "transmission", "fuelType", "bodyType",
  ];
  return keys.filter((k) => {
    const v = f[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined;
  }).length;
}
