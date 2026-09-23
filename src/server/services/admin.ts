import "server-only";
import type { ListingStatus, ReportStatus } from "@prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";

export async function getAdminStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, activeUsers, activeListings, soldVehicles, events, openReports, newUsers, newListings] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { lastSeenAt: { gte: since } } }),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
    db.vehicle.count({ where: { status: "SOLD" } }),
    db.event.count({ where: { status: "ACTIVE", endsAt: { gte: new Date() } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.vehicle.count({ where: { createdAt: { gte: since } } }),
  ]);
  // Last 14 days of new listings for a sparkline chart.
  const rows = await db.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
    FROM "Vehicle"
    WHERE "createdAt" >= NOW() - INTERVAL '14 days'
    GROUP BY 1 ORDER BY 1`;
  const listingsByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    const hit = rows.find((r) => new Date(r.day).toDateString() === d.toDateString());
    return { date: d.toISOString(), count: hit ? Number(hit.count) : 0 };
  });
  return { totalUsers, activeUsers, activeListings, soldVehicles, events, openReports, newUsers, newListings, listingsByDay };
}

export async function adminListUsers(q?: string) {
  return db.user.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }] }
      : undefined,
    select: {
      id: true, name: true, username: true, email: true, image: true, role: true, isBanned: true, sellerType: true, createdAt: true,
      _count: { select: { vehicles: true, reportsAgainst: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function adminSetUserBan(adminId: string, userId: string, banned: boolean) {
  if (adminId === userId) throw new AppError("You can't ban yourself.");
  await db.user.update({ where: { id: userId }, data: { isBanned: banned } });
  if (banned) {
    await db.vehicle.updateMany({ where: { sellerId: userId, status: "ACTIVE" }, data: { status: "PAUSED" } });
    await db.session.deleteMany({ where: { userId } });
  }
}

export async function adminSetUserRole(adminId: string, userId: string, role: "USER" | "ADMIN") {
  if (adminId === userId) throw new AppError("You can't change your own role.");
  await db.user.update({ where: { id: userId }, data: { role } });
}

export async function adminListVehicles(q?: string, status?: ListingStatus) {
  return db.vehicle.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q ? { OR: [{ make: { contains: q, mode: "insensitive" } }, { model: { contains: q, mode: "insensitive" } }] } : {}),
    },
    select: {
      id: true, slug: true, year: true, make: true, model: true, trim: true, price: true, status: true, isFeatured: true, views: true, createdAt: true,
      seller: { select: { name: true, username: true } },
      images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
      _count: { select: { reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function adminUpdateVehicle(id: string, data: { status?: ListingStatus; isFeatured?: boolean }) {
  await db.vehicle.update({ where: { id }, data });
}

export async function adminListEvents() {
  return db.event.findMany({
    select: {
      id: true, slug: true, title: true, type: true, startsAt: true, city: true, state: true, status: true, visibility: true, isFeatured: true,
      organizer: { select: { name: true, username: true } },
      _count: { select: { attendees: true, reports: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 100,
  });
}

export async function adminUpdateEvent(id: string, data: { status?: "ACTIVE" | "CANCELLED"; isFeatured?: boolean }) {
  await db.event.update({ where: { id }, data });
}

export async function adminListReports(status: ReportStatus = "OPEN") {
  return db.report.findMany({
    where: { status },
    select: {
      id: true, reason: true, details: true, status: true, createdAt: true,
      reporter: { select: { name: true, username: true } },
      vehicle: { select: { id: true, slug: true, year: true, make: true, model: true } },
      event: { select: { id: true, slug: true, title: true } },
      targetUser: { select: { id: true, name: true, username: true } },
      review: { select: { id: true, comment: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function adminResolveReport(id: string, status: "RESOLVED" | "DISMISSED") {
  await db.report.update({ where: { id }, data: { status, resolvedAt: new Date() } });
}

export async function adminListReviews() {
  return db.review.findMany({
    select: {
      id: true, rating: true, comment: true, isHidden: true, createdAt: true,
      author: { select: { name: true, username: true } },
      targetUser: { select: { name: true, username: true } },
      _count: { select: { reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function adminSetReviewHidden(id: string, isHidden: boolean) {
  await db.review.update({ where: { id }, data: { isHidden } });
}

export async function adminListCategories() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, description: true, isActive: true, sortOrder: true, _count: { select: { vehicles: true } } },
  });
}

export async function adminUpdateCategory(id: string, data: { name?: string; description?: string | null; isActive?: boolean; sortOrder?: number }) {
  await db.category.update({ where: { id }, data });
}
