import "server-only";
import { Prisma, type ListingStatus } from "@prisma/client";
import { cache } from "react";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { PAGE_SIZE, CATEGORIES } from "@/lib/constants";
import { boundingBox, findCity } from "@/lib/geo";
import type { MarketplaceFilters } from "@/lib/search/filters";
import { resolveFilters, type ResolvedFilters } from "@/lib/search/parse-query";
import { createVehicleSchema, type CreateVehicleInput } from "@/lib/validation";
import { randomSuffix, slugify, vehicleTitle } from "@/lib/utils";
import { notify } from "@/server/services/notifications";

export const vehicleCardSelect = {
  id: true,
  slug: true,
  make: true,
  model: true,
  trim: true,
  year: true,
  price: true,
  mileage: true,
  city: true,
  state: true,
  condition: true,
  fuelType: true,
  transmission: true,
  status: true,
  isFeatured: true,
  openToTrade: true,
  createdAt: true,
  images: { select: { url: true, alt: true }, orderBy: { order: "asc" }, take: 1 },
  seller: { select: { id: true, name: true, username: true, sellerType: true } },
} satisfies Prisma.VehicleSelect;

export type VehicleCardData = Prisma.VehicleGetPayload<{ select: typeof vehicleCardSelect }>;

// ── Search ──────────────────────────────────────────────────

export function buildVehicleWhere(f: ResolvedFilters): Prisma.VehicleWhereInput {
  const and: Prisma.VehicleWhereInput[] = [{ status: "ACTIVE" }];

  if (f.category?.length) and.push({ category: { slug: { in: f.category } } });
  if (f.condition?.length) and.push({ condition: { in: f.condition } });
  if (f.make?.length) and.push({ OR: f.make.map((m) => ({ make: { equals: m, mode: "insensitive" as const } })) });
  if (f.model) and.push({ model: { contains: f.model, mode: "insensitive" } });
  if (f.minPrice !== undefined || f.maxPrice !== undefined) and.push({ price: { gte: f.minPrice, lte: f.maxPrice } });
  if (f.minYear !== undefined || f.maxYear !== undefined) and.push({ year: { gte: f.minYear, lte: f.maxYear } });
  if (f.maxMileage !== undefined) and.push({ mileage: { lte: f.maxMileage } });
  if (f.transmission) and.push({ transmission: f.transmission });
  if (f.fuelType?.length) and.push({ fuelType: { in: f.fuelType } });
  if (f.bodyType?.length) and.push({ bodyType: { in: f.bodyType } });
  if (f.country) and.push({ country: { equals: f.country, mode: "insensitive" } });
  if (f.state) and.push({ state: { equals: f.state, mode: "insensitive" } });

  if (f.city) {
    const known = findCity(f.city);
    if (known && f.radius) {
      const box = boundingBox(known.lat, known.lng, f.radius);
      and.push({ latitude: { gte: box.minLat, lte: box.maxLat }, longitude: { gte: box.minLng, lte: box.maxLng } });
    } else {
      and.push({ city: { equals: f.city, mode: "insensitive" } });
    }
  }

  for (const term of f.terms.slice(0, 6)) {
    and.push({
      OR: [
        { model: { contains: term, mode: "insensitive" } },
        { trim: { contains: term, mode: "insensitive" } },
        { make: { contains: term, mode: "insensitive" } },
        { engine: { contains: term, mode: "insensitive" } },
        { exteriorColor: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  return { AND: and };
}

function orderBy(sort: MarketplaceFilters["sort"]): Prisma.VehicleOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "mileage":
      return [{ mileage: "asc" }, { id: "asc" }];
    case "views":
      return [{ views: "desc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export async function searchVehicles(filters: MarketplaceFilters, pageSize = PAGE_SIZE) {
  const resolved = resolveFilters(filters);
  const where = buildVehicleWhere(resolved);
  const [items, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      select: vehicleCardSelect,
      orderBy: orderBy(filters.sort),
      skip: (filters.page - 1) * pageSize,
      take: pageSize,
    }),
    db.vehicle.count({ where }),
  ]);
  return {
    items,
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    understood: resolved.understood,
  };
}
export type SearchResult = Awaited<ReturnType<typeof searchVehicles>>;

// ── Homepage collections ────────────────────────────────────

export async function getFeaturedVehicles(take = 8) {
  return db.vehicle.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    select: vehicleCardSelect,
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getRecentVehicles(take = 8) {
  return db.vehicle.findMany({
    where: { status: "ACTIVE" },
    select: vehicleCardSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getPopularLocations(take = 8) {
  const rows = await db.vehicle.groupBy({
    by: ["city", "state"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });
  return rows.map((r) => ({ city: r.city, state: r.state, count: r._count._all }));
}

export const getCategoriesWithCounts = cache(async () => {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, image: true, _count: { select: { vehicles: { where: { status: "ACTIVE" } } } } },
  });
  return categories.map((c) => ({ ...c, count: c._count.vehicles }));
});

export async function getMakesInUse() {
  const rows = await db.vehicle.groupBy({ by: ["make"], where: { status: "ACTIVE" }, orderBy: { make: "asc" } });
  return rows.map((r) => r.make);
}

// ── Listing detail ──────────────────────────────────────────

export const getVehicleBySlug = cache(async (slug: string) => {
  const vehicle = await db.vehicle.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      category: { select: { slug: true, name: true } },
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          city: true,
          state: true,
          sellerType: true,
          createdAt: true,
          lastSeenAt: true,
          _count: { select: { vehicles: { where: { status: "ACTIVE" } }, reviewsReceived: true } },
        },
      },
      _count: { select: { favorites: true } },
    },
  });
  if (!vehicle || vehicle.status === "REMOVED" || vehicle.status === "DRAFT") return null;
  const rating = await db.review.aggregate({
    where: { targetUserId: vehicle.sellerId, isHidden: false },
    _avg: { rating: true },
  });
  return { ...vehicle, sellerRating: rating._avg.rating ?? null };
});
export type VehicleDetail = NonNullable<Awaited<ReturnType<typeof getVehicleBySlug>>>;

export async function incrementVehicleViews(id: string) {
  await db.vehicle.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => undefined);
}

export async function getSimilarVehicles(v: { id: string; make: string; bodyType: VehicleDetail["bodyType"]; price: number }) {
  return db.vehicle.findMany({
    where: {
      status: "ACTIVE",
      id: { not: v.id },
      OR: [{ make: v.make }, { bodyType: v.bodyType, price: { gte: v.price * 0.6, lte: v.price * 1.4 } }],
    },
    select: vehicleCardSelect,
    orderBy: { views: "desc" },
    take: 4,
  });
}

// ── Seller operations ───────────────────────────────────────

async function uniqueSlug(base: string) {
  const root = slugify(base);
  for (let i = 0; i < 5; i++) {
    const slug = `${root}-${randomSuffix()}`;
    const exists = await db.vehicle.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }
  return `${root}-${randomSuffix(10)}`;
}

function toVehicleData(input: ReturnType<typeof createVehicleSchema.parse>, categoryId: string) {
  const city = findCity(input.city);
  return {
    categoryId,
    make: input.make,
    model: input.model,
    trim: input.trim ?? null,
    year: input.year,
    mileage: input.mileage,
    price: input.price,
    condition: input.condition,
    bodyType: input.bodyType,
    transmission: input.transmission,
    fuelType: input.fuelType,
    engine: input.engine,
    drivetrain: input.drivetrain,
    exteriorColor: input.exteriorColor ?? null,
    interiorColor: input.interiorColor ?? null,
    vin: input.vin ?? null,
    description: input.description,
    features: input.features,
    openToTrade: input.openToTrade,
    country: input.country,
    state: input.state,
    city: input.city,
    postalCode: input.postalCode,
    latitude: city?.lat ?? null,
    longitude: city?.lng ?? null,
  };
}

async function categoryIdFor(slug: string) {
  const category = await db.category.findUnique({ where: { slug }, select: { id: true, isActive: true } });
  if (!category?.isActive) throw new AppError("Choose a valid category.");
  return category.id;
}

export async function createVehicle(sellerId: string, raw: CreateVehicleInput) {
  const input = createVehicleSchema.parse(raw);
  const categoryId = await categoryIdFor(input.category);
  const slug = await uniqueSlug(vehicleTitle(input));
  return db.vehicle.create({
    data: {
      ...toVehicleData(input, categoryId),
      slug,
      sellerId,
      status: "ACTIVE",
      images: { create: input.images.map((url, order) => ({ url, order, alt: `${vehicleTitle(input)} photo ${order + 1}` })) },
    },
    select: { id: true, slug: true },
  });
}

async function assertOwner(userId: string, vehicleId: string) {
  const v = await db.vehicle.findUnique({ where: { id: vehicleId }, select: { sellerId: true, status: true, slug: true } });
  if (!v || v.status === "REMOVED") throw new AppError("Unable to load this listing.", "NOT_FOUND");
  if (v.sellerId !== userId) throw new AppError("You can only manage your own listings.", "FORBIDDEN");
  return v;
}

export async function updateVehicle(userId: string, vehicleId: string, raw: CreateVehicleInput) {
  await assertOwner(userId, vehicleId);
  const input = createVehicleSchema.parse(raw);
  const categoryId = await categoryIdFor(input.category);
  return db.$transaction(async (tx) => {
    await tx.vehicleImage.deleteMany({ where: { vehicleId } });
    return tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...toVehicleData(input, categoryId),
        images: { create: input.images.map((url, order) => ({ url, order, alt: `${vehicleTitle(input)} photo ${order + 1}` })) },
      },
      select: { id: true, slug: true },
    });
  });
}

export async function setVehicleStatus(userId: string, vehicleId: string, status: Extract<ListingStatus, "ACTIVE" | "PAUSED" | "SOLD">) {
  await assertOwner(userId, vehicleId);
  const vehicle = await db.vehicle.update({
    where: { id: vehicleId },
    data: { status, soldAt: status === "SOLD" ? new Date() : null },
    select: { id: true, slug: true, year: true, make: true, model: true, trim: true },
  });
  if (status === "SOLD") {
    // Let everyone who saved this listing know it's gone.
    const favs = await db.favorite.findMany({ where: { vehicleId }, select: { userId: true } });
    await Promise.all(
      favs
        .filter((f) => f.userId !== userId)
        .map((f) =>
          notify({
            userId: f.userId,
            actorId: userId,
            type: "LISTING_SOLD",
            title: "A saved vehicle was sold",
            body: `${vehicleTitle(vehicle)} is no longer available.`,
            link: `/vehicles/${vehicle.slug}`,
          }),
        ),
    );
    await db.offer.updateMany({ where: { vehicleId, status: "PENDING" }, data: { status: "DECLINED" } });
  }
  return vehicle;
}

export async function deleteVehicle(userId: string, vehicleId: string) {
  await assertOwner(userId, vehicleId);
  // Soft delete keeps conversation and trade history intact.
  await db.vehicle.update({ where: { id: vehicleId }, data: { status: "REMOVED" } });
}

export async function getVehicleForEdit(userId: string, vehicleId: string) {
  await assertOwner(userId, vehicleId);
  return db.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    include: { images: { orderBy: { order: "asc" } }, category: { select: { slug: true } } },
  });
}

export async function getSellerListings(userId: string) {
  return db.vehicle.findMany({
    where: { sellerId: userId, status: { not: "REMOVED" } },
    select: {
      ...vehicleCardSelect,
      views: true,
      updatedAt: true,
      _count: { select: { favorites: true, offers: true, conversations: true, tradesRequested: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
export type SellerListing = Awaited<ReturnType<typeof getSellerListings>>[number];

export async function getTradeableVehicles(userId: string) {
  return db.vehicle.findMany({
    where: { sellerId: userId, status: { in: ["ACTIVE", "PAUSED"] } },
    select: vehicleCardSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
