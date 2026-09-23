import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function randomSuffix(length = 6) {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("en-US");

export const formatPrice = (value: number) => currency.format(value);
export const formatNumber = (value: number) => integer.format(value);
export const formatCompact = (value: number) => compact.format(value);
export const formatMileage = (miles: number) => `${integer.format(miles)} miles`;

export function formatSignedCash(value: number) {
  if (value === 0) return "Straight trade";
  return value > 0 ? `+ ${formatPrice(value)} cash` : `− ${formatPrice(Math.abs(value))} cash`;
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", ...opts }).format(
    new Date(date),
  );
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

export function formatEventDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(date));
}

export function timeAgo(date: Date | string) {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const units: [number, string][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [604800, "week"],
    [2629800, "month"],
    [31557600, "year"],
  ];
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, label] = units[i];
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

export function initials(name?: string | null) {
  if (!name) return "SC";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function vehicleTitle(v: { year: number; make: string; model: string; trim?: string | null }) {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}

export function locationLabel(l: { city?: string | null; state?: string | null; country?: string | null }) {
  return [l.city, l.state].filter(Boolean).join(", ") || l.country || "";
}

/**
 * Public base URL of the site. Falls back to Vercel's system variables and then
 * localhost, and ignores empty or malformed values instead of crashing.
 */
export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    try {
      return new URL(value.includes("://") ? value : `https://${value}`).origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function isRecent(date: Date | string, windowMs: number) {
  return Date.now() - new Date(date).getTime() < windowMs;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
