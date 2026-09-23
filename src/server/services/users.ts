import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { notify } from "@/server/services/notifications";
import { vehicleCardSelect } from "@/server/services/vehicles";
import { eventCardSelect } from "@/server/services/events";
import { garageVehicleSchema, profileSchema, reviewSchema } from "@/lib/validation";
import { randomSuffix, slugify } from "@/lib/utils";
import type { z } from "zod";

export async function generateUniqueUsername(seed: string) {
  const base = slugify(seed).replace(/-/g, "_").slice(0, 18) || "driver";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? base : `${base}_${randomSuffix(4)}`;
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}_${randomSuffix(8)}`;
}

export const getProfile = cache(async (username: string) => {
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      city: true,
      state: true,
      country: true,
      sellerType: true,
      role: true,
      isBanned: true,
      createdAt: true,
      lastSeenAt: true,
      _count: {
        select: {
          vehicles: { where: { status: "ACTIVE" } },
          garage: true,
          eventsOrganized: true,
          eventAttendance: true,
          followers: true,
          following: true,
          reviewsReceived: { where: { isHidden: false } },
        },
      },
    },
  });
  if (!user || user.isBanned) return null;
  const rating = await db.review.aggregate({ where: { targetUserId: user.id, isHidden: false }, _avg: { rating: true } });
  const soldCount = await db.vehicle.count({ where: { sellerId: user.id, status: "SOLD" } });
  return { ...user, rating: rating._avg.rating ?? null, soldCount };
});
export type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

export async function getProfileTabs(userId: string) {
  const [listings, garage, events, reviews] = await Promise.all([
    db.vehicle.findMany({ where: { sellerId: userId, status: "ACTIVE" }, select: vehicleCardSelect, orderBy: { createdAt: "desc" }, take: 24 }),
    db.garageVehicle.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } }),
    db.event.findMany({
      where: { visibility: "PUBLIC", OR: [{ organizerId: userId }, { attendees: { some: { userId } } }] },
      select: { ...eventCardSelect, organizerId: true },
      orderBy: { startsAt: "desc" },
      take: 24,
    }),
    db.review.findMany({
      where: { targetUserId: userId, isHidden: false },
      select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return { listings, garage, events, reviews };
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await db.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
  return Boolean(row);
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) throw new AppError("You can't follow yourself.");
  const key = { followerId_followingId: { followerId, followingId } };
  const existing = await db.follow.findUnique({ where: key });
  if (existing) {
    await db.follow.delete({ where: key });
    return false;
  }
  const target = await db.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) throw new AppError("User not found.", "NOT_FOUND");
  await db.follow.create({ data: { followerId, followingId } });
  const follower = await db.user.findUnique({ where: { id: followerId }, select: { name: true, username: true } });
  await notify({
    userId: followingId,
    actorId: followerId,
    type: "NEW_FOLLOWER",
    title: "New follower",
    body: `${follower?.name ?? "Someone"} started following you.`,
    link: follower?.username ? `/u/${follower.username}` : undefined,
  });
  return true;
}

export async function createReview(authorId: string, raw: z.input<typeof reviewSchema>) {
  const input = reviewSchema.parse(raw);
  if (input.targetUserId === authorId) throw new AppError("You can't review yourself.");
  // Reviews require a real interaction: a conversation between both users.
  const interacted = await db.conversation.findFirst({
    where: { AND: [{ participants: { some: { userId: authorId } } }, { participants: { some: { userId: input.targetUserId } } }] },
    select: { id: true },
  });
  if (!interacted) throw new AppError("You can review members you've been in touch with.", "FORBIDDEN");

  await db.review.upsert({
    where: { authorId_targetUserId: { authorId, targetUserId: input.targetUserId } },
    create: { authorId, targetUserId: input.targetUserId, rating: input.rating, comment: input.comment },
    update: { rating: input.rating, comment: input.comment, createdAt: new Date() },
  });
  const [author, target] = await Promise.all([
    db.user.findUnique({ where: { id: authorId }, select: { name: true } }),
    db.user.findUnique({ where: { id: input.targetUserId }, select: { username: true } }),
  ]);
  await notify({
    userId: input.targetUserId,
    actorId: authorId,
    type: "NEW_REVIEW",
    title: "New review",
    body: `${author?.name ?? "Someone"} left you a ${input.rating}-star review.`,
    link: target?.username ? `/u/${target.username}?tab=reviews` : undefined,
  });
}

export async function updateProfile(userId: string, raw: z.input<typeof profileSchema>) {
  const input = profileSchema.parse(raw);
  await db.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      bio: input.bio ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      country: input.country ?? null,
      ...(input.image ? { image: input.image } : {}),
    },
  });
}

export async function addGarageVehicle(userId: string, raw: z.input<typeof garageVehicleSchema>) {
  const input = garageVehicleSchema.parse(raw);
  const count = await db.garageVehicle.count({ where: { ownerId: userId } });
  if (count >= 30) throw new AppError("Your garage is full (30 vehicles).");
  await db.garageVehicle.create({ data: { ownerId: userId, ...input } });
}

export async function removeGarageVehicle(userId: string, id: string) {
  await db.garageVehicle.deleteMany({ where: { id, ownerId: userId } });
}

export async function getSettingsUser(userId: string) {
  const { passwordHash, ...user } = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, username: true, email: true, image: true, bio: true, city: true, state: true, country: true, passwordHash: true },
  });
  // Never expose the hash itself — only whether one exists.
  return { ...user, hasPassword: Boolean(passwordHash) };
}

export async function touchLastSeen(userId: string) {
  await db.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
}
