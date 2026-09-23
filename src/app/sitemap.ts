import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { absoluteUrl } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vehicles, events, users] = await Promise.all([
    db.vehicle.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 45_000 }),
    db.event.findMany({ where: { visibility: "PUBLIC", status: "ACTIVE" }, select: { slug: true, updatedAt: true }, take: 5_000 }),
    db.user.findMany({ where: { isBanned: false, username: { not: null }, vehicles: { some: { status: "ACTIVE" } } }, select: { username: true, updatedAt: true }, take: 5_000 }),
  ]).catch(() => [[], [], []] as const); // Fall back to static pages if the database is unreachable (e.g. at build time).
  const staticPages = ["/", "/marketplace", "/events", "/sell", "/about", "/safety", "/terms", "/privacy"].map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: "daily" as const,
    priority: p === "/" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(`/marketplace?category=${c.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
    ...vehicles.map((v) => ({ url: absoluteUrl(`/vehicles/${v.slug}`), lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...events.map((e) => ({ url: absoluteUrl(`/events/${e.slug}`), lastModified: e.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...users.map((u) => ({ url: absoluteUrl(`/u/${u.username}`), lastModified: u.updatedAt, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
