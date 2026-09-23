import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { notify } from "@/server/services/notifications";
import { vehicleCardSelect } from "@/server/services/vehicles";
import { eventCardSelect } from "@/server/services/events";
import { vehicleTitle } from "@/lib/utils";

export type FavoriteKind = "vehicle" | "event" | "seller";

/** Toggle a favorite; returns the new state. */
export async function toggleFavorite(userId: string, kind: FavoriteKind, targetId: string) {
  const field = kind === "vehicle" ? "vehicleId" : kind === "event" ? "eventId" : "sellerId";
  const existing = await db.favorite.findFirst({ where: { userId, [field]: targetId }, select: { id: true } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return false;
  }

  if (kind === "vehicle") {
    const v = await db.vehicle.findUnique({
      where: { id: targetId },
      select: { id: true, slug: true, sellerId: true, status: true, year: true, make: true, model: true, trim: true },
    });
    if (!v || v.status === "REMOVED") throw new AppError("Unable to load this listing.", "NOT_FOUND");
    await db.favorite.create({ data: { userId, vehicleId: v.id } });
    const liker = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    await notify({
      userId: v.sellerId,
      actorId: userId,
      type: "LISTING_FAVORITED",
      title: "Someone saved your listing",
      body: `${liker?.name ?? "A member"} added your ${vehicleTitle(v)} to their favorites.`,
      link: `/vehicles/${v.slug}`,
    });
  } else if (kind === "event") {
    const e = await db.event.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!e) throw new AppError("This event is no longer available.", "NOT_FOUND");
    await db.favorite.create({ data: { userId, eventId: e.id } });
  } else {
    if (targetId === userId) throw new AppError("You can't save yourself.");
    const u = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!u) throw new AppError("User not found.", "NOT_FOUND");
    await db.favorite.create({ data: { userId, sellerId: u.id } });
  }
  return true;
}

export async function getFavoriteIds(userId: string | null | undefined) {
  if (!userId) return { vehicles: new Set<string>(), events: new Set<string>(), sellers: new Set<string>() };
  const rows = await db.favorite.findMany({ where: { userId }, select: { vehicleId: true, eventId: true, sellerId: true } });
  return {
    vehicles: new Set(rows.flatMap((r) => (r.vehicleId ? [r.vehicleId] : []))),
    events: new Set(rows.flatMap((r) => (r.eventId ? [r.eventId] : []))),
    sellers: new Set(rows.flatMap((r) => (r.sellerId ? [r.sellerId] : []))),
  };
}

export async function listFavorites(userId: string) {
  const [vehicles, events, sellers] = await Promise.all([
    db.favorite.findMany({
      where: { userId, vehicleId: { not: null }, vehicle: { status: { not: "REMOVED" } } },
      select: { vehicle: { select: vehicleCardSelect } },
      orderBy: { createdAt: "desc" },
    }),
    db.favorite.findMany({
      where: { userId, eventId: { not: null } },
      select: { event: { select: eventCardSelect } },
      orderBy: { createdAt: "desc" },
    }),
    db.favorite.findMany({
      where: { userId, sellerId: { not: null } },
      select: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            city: true,
            state: true,
            sellerType: true,
            _count: { select: { vehicles: { where: { status: "ACTIVE" } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    vehicles: vehicles.flatMap((f) => (f.vehicle ? [f.vehicle] : [])),
    events: events.flatMap((f) => (f.event ? [f.event] : [])),
    sellers: sellers.flatMap((f) => (f.seller ? [f.seller] : [])),
  };
}
