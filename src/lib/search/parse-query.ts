import { CITIES } from "@/lib/geo";
import { BODY_TYPES, FUEL_TYPES, MAKES, type BodyTypeValue, type Condition, type FuelTypeValue, type TransmissionValue } from "@/lib/constants";
import type { MarketplaceFilters } from "./filters";

/**
 * Natural-language search understanding for the marketplace.
 *
 * Turns queries such as
 *   "BMW M3"                → make=BMW, text="m3"
 *   "Porsche under $100,000" → make=Porsche, maxPrice=100000
 *   "2020+ Toyota SUV"       → minYear=2020, make=Toyota, bodyType=SUV
 *   "Ford Mustang in Miami"  → make=Ford, text="mustang", city=Miami
 * into structured filters plus leftover free-text terms.
 */

export type ParsedQuery = Partial<Omit<MarketplaceFilters, "sort" | "page" | "q">> & {
  terms: string[];
  /** Human-readable chips describing what was understood. */
  understood: string[];
};

const MAKE_ALIASES: Record<string, string> = {
  chevy: "Chevrolet",
  merc: "Mercedes-Benz",
  mercedes: "Mercedes-Benz",
  benz: "Mercedes-Benz",
  vw: "Volkswagen",
  harley: "Harley-Davidson",
  "land rover": "Land Rover",
  range: "Land Rover",
  "alfa romeo": "Alfa Romeo",
  alfa: "Alfa Romeo",
  "aston martin": "Aston Martin",
  "rolls royce": "Rolls-Royce",
  lambo: "Lamborghini",
  beemer: "BMW",
  bimmer: "BMW",
};

const BODY_WORDS: Record<string, BodyTypeValue> = {
  suv: "SUV", suvs: "SUV", crossover: "SUV",
  sedan: "SEDAN", sedans: "SEDAN",
  coupe: "COUPE", coupes: "COUPE",
  truck: "PICKUP", trucks: "PICKUP", pickup: "PICKUP", pickups: "PICKUP",
  hatchback: "HATCHBACK", hatch: "HATCHBACK",
  convertible: "CONVERTIBLE", cabriolet: "CONVERTIBLE", roadster: "CONVERTIBLE", spyder: "CONVERTIBLE",
  wagon: "WAGON", estate: "WAGON",
  van: "VAN", minivan: "VAN",
  motorcycle: "MOTORCYCLE", motorcycles: "MOTORCYCLE", bike: "MOTORCYCLE", motorbike: "MOTORCYCLE",
};

const FUEL_WORDS: Record<string, FuelTypeValue> = {
  electric: "ELECTRIC", ev: "ELECTRIC", evs: "ELECTRIC",
  hybrid: "HYBRID", phev: "HYBRID",
  diesel: "DIESEL",
  gas: "GASOLINE", gasoline: "GASOLINE", petrol: "GASOLINE",
};

const CATEGORY_WORDS: Record<string, string> = {
  classic: "classic-cars", classics: "classic-cars", vintage: "classic-cars",
  sports: "sports-cars", "sports car": "sports-cars", "sport car": "sports-cars",
  parts: "parts-accessories", accessories: "parts-accessories", wheels: "parts-accessories",
};

const CONDITION_WORDS: Record<string, Condition> = { new: "NEW", used: "USED", certified: "CERTIFIED", cpo: "CERTIFIED" };
const TRANSMISSION_WORDS: Record<string, TransmissionValue> = {
  manual: "MANUAL", stick: "MANUAL", "stick shift": "MANUAL", automatic: "AUTOMATIC", auto: "AUTOMATIC",
};

const STOP_WORDS = new Set(["a", "an", "the", "for", "with", "and", "or", "cars", "car", "vehicle", "vehicles", "sale", "cheap", "listing"]);

function parseAmount(raw: string): number | undefined {
  const m = raw.toLowerCase().replace(/[$,\s]/g, "").match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return undefined;
  let n = Number.parseFloat(m[1]!);
  if (m[2] === "k") n *= 1_000;
  if (m[2] === "m") n *= 1_000_000;
  return Math.round(n);
}

const AMOUNT = String.raw`\$?\s?\d[\d,]*(?:\.\d+)?\s?[km]?`;
const CURRENT_YEAR = new Date().getFullYear();

export function parseSearchQuery(input: string): ParsedQuery {
  const out: ParsedQuery = { terms: [], understood: [] };
  let q = ` ${input.toLowerCase().replace(/\s+/g, " ").trim()} `;
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = q.match(re);
    if (m) {
      fn(m);
      q = q.replace(m[0], " ");
    }
  };

  // Mileage: "under 30k miles", "less than 50,000 mi"
  take(new RegExp(String.raw`\b(?:under|below|less than|max|<)\s*(${AMOUNT})\s*(?:miles|mi|km)\b`), (m) => {
    const n = parseAmount(m[1]!);
    if (n) {
      out.maxMileage = n;
      out.understood.push(`Under ${n.toLocaleString("en-US")} miles`);
    }
  });

  // Price ranges
  take(new RegExp(String.raw`\bbetween\s+(${AMOUNT})\s+(?:and|-|to)\s+(${AMOUNT})`), (m) => {
    const a = parseAmount(m[1]!);
    const b = parseAmount(m[2]!);
    if (a !== undefined && b !== undefined) {
      out.minPrice = Math.min(a, b);
      out.maxPrice = Math.max(a, b);
      out.understood.push(`$${out.minPrice.toLocaleString("en-US")} – $${out.maxPrice.toLocaleString("en-US")}`);
    }
  });
  take(new RegExp(String.raw`\b(?:under|below|less than|max|up to|<)\s*(${AMOUNT})`), (m) => {
    const n = parseAmount(m[1]!);
    if (n && n > 2100) {
      out.maxPrice = n;
      out.understood.push(`Under $${n.toLocaleString("en-US")}`);
    }
  });
  take(new RegExp(String.raw`\b(?:over|above|more than|min|at least|>)\s*(${AMOUNT})`), (m) => {
    const n = parseAmount(m[1]!);
    if (n && n > 2100) {
      out.minPrice = n;
      out.understood.push(`Over $${n.toLocaleString("en-US")}`);
    }
  });

  // Year ranges: "2018-2022", "2020+", "after 2019", "before 2000", "2021"
  take(/\b(19[5-9]\d|20[0-4]\d)\s?(?:-|to)\s?(19[5-9]\d|20[0-4]\d)\b/, (m) => {
    out.minYear = Math.min(+m[1]!, +m[2]!);
    out.maxYear = Math.max(+m[1]!, +m[2]!);
    out.understood.push(`${out.minYear}–${out.maxYear}`);
  });
  take(/\b(19[5-9]\d|20[0-4]\d)\s?(?:\+|or newer|and newer|and up)/, (m) => {
    out.minYear = +m[1]!;
    out.understood.push(`${m[1]} or newer`);
  });
  take(/\b(?:after|newer than|since)\s+(19[5-9]\d|20[0-4]\d)\b/, (m) => {
    out.minYear = +m[1]! + (/(after|newer)/.test(m[0]) ? 1 : 0);
    out.understood.push(`${out.minYear} or newer`);
  });
  take(/\b(?:before|older than|pre)\s*-?\s*(19[5-9]\d|20[0-4]\d)\b/, (m) => {
    out.maxYear = +m[1]! - 1;
    out.understood.push(`${out.maxYear} or older`);
  });
  if (out.minYear === undefined && out.maxYear === undefined) {
    take(/\b(19[5-9]\d|20[0-4]\d)\b/, (m) => {
      const y = +m[1]!;
      if (y <= CURRENT_YEAR + 1) {
        out.minYear = y;
        out.maxYear = y;
        out.understood.push(`Year ${y}`);
      }
    });
  }

  // Location: "in Miami", "near Austin, TX"
  take(/\b(?:in|near|around)\s+([a-z .'-]+?)(?:,\s*([a-z]{2}))?(?=\s(?:under|below|over|above|between|with|for|$)|\s*$)/, (m) => {
    const name = m[1]!.trim();
    const city = CITIES.find((c) => c.city.toLowerCase() === name);
    if (city) {
      out.city = city.city;
      out.understood.push(`In ${city.city}, ${city.state}`);
    } else if (name.length === 2) {
      out.state = name.toUpperCase();
      out.understood.push(`In ${out.state}`);
    } else {
      out.city = name.replace(/\b\w/g, (c) => c.toUpperCase());
      out.understood.push(`In ${out.city}`);
    }
  });

  // Multi-word lookups first (makes, categories, transmissions)
  const multiWord: [Record<string, string>, (v: string) => void][] = [
    [MAKE_ALIASES, (v) => addMake(v)],
    [CATEGORY_WORDS, (v) => addCategory(v)],
    [TRANSMISSION_WORDS, (v) => setTransmission(v as TransmissionValue)],
  ];
  function addMake(v: string) {
    out.make = Array.from(new Set([...(out.make ?? []), v]));
    out.understood.push(v);
  }
  function addCategory(v: string) {
    out.category = Array.from(new Set([...(out.category ?? []), v]));
    out.understood.push(v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  function setTransmission(v: TransmissionValue) {
    out.transmission = v;
    out.understood.push(v === "MANUAL" ? "Manual" : "Automatic");
  }
  for (const [dict, apply] of multiWord) {
    for (const key of Object.keys(dict).filter((k) => k.includes(" "))) {
      take(new RegExp(String.raw`\b${key}\b`), () => apply(dict[key]!));
    }
  }
  for (const make of MAKES) {
    const key = make.toLowerCase();
    const pattern = key.replace(/[-\s]/g, "[-\\s]?");
    take(new RegExp(String.raw`(?:^|\s)${pattern}(?=\s|$)`), () => addMake(make));
  }

  for (const token of q.split(" ").filter(Boolean)) {
    if (MAKE_ALIASES[token]) addMake(MAKE_ALIASES[token]);
    else if (BODY_WORDS[token]) {
      out.bodyType = Array.from(new Set([...(out.bodyType ?? []), BODY_WORDS[token]]));
      out.understood.push(BODY_TYPES.labels[BODY_WORDS[token]]);
    } else if (FUEL_WORDS[token]) {
      out.fuelType = Array.from(new Set([...(out.fuelType ?? []), FUEL_WORDS[token]]));
      out.understood.push(FUEL_TYPES.labels[FUEL_WORDS[token]]);
    } else if (CATEGORY_WORDS[token]) addCategory(CATEGORY_WORDS[token]);
    else if (CONDITION_WORDS[token]) {
      out.condition = [CONDITION_WORDS[token]];
      out.understood.push(token[0]!.toUpperCase() + token.slice(1));
    } else if (TRANSMISSION_WORDS[token]) setTransmission(TRANSMISSION_WORDS[token]);
    else if (!STOP_WORDS.has(token)) {
      const clean = token.replace(/[^a-z0-9.-]/g, "");
      if (clean.length >= 1) out.terms.push(clean);
    }
  }

  out.understood = Array.from(new Set(out.understood));
  return out;
}

/**
 * Combine structured filters from the UI with what the free-text query implies.
 * Explicit UI filters always win over inferred values.
 */
export function resolveFilters(filters: MarketplaceFilters) {
  const parsed = filters.q ? parseSearchQuery(filters.q) : { terms: [], understood: [] as string[] };
  const pick = <K extends keyof ParsedQuery & keyof MarketplaceFilters>(key: K) =>
    (filters[key] ?? (parsed as ParsedQuery)[key]) as MarketplaceFilters[K];
  return {
    ...filters,
    category: pick("category"),
    condition: pick("condition"),
    make: pick("make"),
    minPrice: pick("minPrice"),
    maxPrice: pick("maxPrice"),
    minYear: pick("minYear"),
    maxYear: pick("maxYear"),
    maxMileage: pick("maxMileage"),
    city: pick("city"),
    state: pick("state"),
    transmission: pick("transmission"),
    fuelType: pick("fuelType"),
    bodyType: pick("bodyType"),
    terms: parsed.terms,
    understood: parsed.understood,
  };
}
export type ResolvedFilters = ReturnType<typeof resolveFilters>;
