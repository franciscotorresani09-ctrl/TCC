import "server-only";
import type { EventType, Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { notify } from "@/server/services/notifications";
import { eventSchema, type EventInput } from "@/lib/validation";
import { randomSuffix, slugify } from "@/lib/utils";

export const eventCardSelect = {
  id: true,
  slug: true,
  title: true,
  type: true,
  startsAt: true,
  endsAt: true,
  venue: true,
  city: true,
  state: true,
  coverImage: true,
  maxAttendees: true,
  visibility: true,
  status: true,
  isFeatured: true,
  _count: { select: { attendees: true } },
} satisfies Prisma.EventSelect;

export type EventCardData = Prisma.EventGetPayload<{ select: typeof eventCardSelect }>;

export async function listUpcomingEvents(opts: { type?: EventType; city?: string; q?: string; take?: number; page?: number } = {}) {
  const take = opts.take ?? 12;
  const where: Prisma.EventWhereInput = {
    visibility: "PUBLIC",
    status: "ACTIVE",
    endsAt: { gte: new Date() },
    ...(opts.type ? { type: opts.type } : {}),
    ...(opts.city ? { city: { equals: opts.city, mode: "insensitive" } } : {}),
    ...(opts.q
      ? {
          OR: [
            { title: { contains: opts.q, mode: "insensitive" } },
            { city: { contains: opts.q, mode: "insensitive" } },
            { venue: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.event.findMany({
      where,
      select: eventCardSelect,
      orderBy: { startsAt: "asc" },
      skip: ((opts.page ?? 1) - 1) * take,
      take,
    }),
    db.event.count({ where }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / take)) };
}

export const getEventBySlug = cache(async (slug: string, viewerId?: string | null) => {
  const event = await db.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, name: true, username: true, image: true, _count: { select: { eventsOrganized: true } } } },
      attendees: {
        where: { status: "GOING" },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: { user: { select: { id: true, name: true, username: true, image: true } } },
      },
      _count: { select: { attendees: { where: { status: "GOING" } } } },
    },
  });
  if (!event) return null;
  // Private events are visible only to the organizer and people who RSVP'd.
  if (event.visibility === "PRIVATE" && event.organizerId !== viewerId) {
    const rsvp = viewerId
      ? await db.eventAttendee.findUnique({ where: { eventId_userId: { eventId: event.id, userId: viewerId } } })
      : null;
    if (!rsvp) return null;
  }
  return event;
});
export type EventDetail = NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>;

export async function getViewerRsvp(eventId: string, userId: string) {
  const rsvp = await db.eventAttendee.findUnique({ where: { eventId_userId: { eventId, userId } }, select: { status: true } });
  return rsvp?.status ?? null;
}

function combine(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export async function createEvent(organizerId: string, raw: EventInput) {
  const input = eventSchema.parse(raw);
  const slug = `${slugify(input.title)}-${randomSuffix()}`;
  const event = await db.event.create({
    data: {
      slug,
      organizerId,
      title: input.title,
      description: input.description,
      type: input.type,
      startsAt: combine(input.date, input.startTime),
      endsAt: combine(input.date, input.endTime),
      venue: input.venue,
      city: input.city,
      state: input.state,
      country: input.country,
      coverImage: input.coverImage,
      maxAttendees: input.maxAttendees ?? null,
      visibility: input.visibility,
      attendees: { create: { userId: organizerId, status: "GOING" } },
    },
    select: { slug: true },
  });
  return event;
}

export async function setRsvp(userId: string, eventId: string, status: "GOING" | "INTERESTED" | null) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, slug: true, title: true, organizerId: true, maxAttendees: true, status: true, endsAt: true },
  });
  if (!event || event.status !== "ACTIVE") throw new AppError("This event is no longer available.", "NOT_FOUND");
  if (event.endsAt < new Date()) throw new AppError("This event has already ended.");

  if (status === null) {
    if (event.organizerId === userId) throw new AppError("Organizers can't leave their own event.");
    await db.eventAttendee.deleteMany({ where: { eventId, userId } });
    return;
  }

  if (status === "GOING" && event.maxAttendees) {
    const going = await db.eventAttendee.count({ where: { eventId, status: "GOING", userId: { not: userId } } });
    if (going >= event.maxAttendees) throw new AppError("This event is full.", "CONFLICT");
  }

  const existing = await db.eventAttendee.findUnique({ where: { eventId_userId: { eventId, userId } } });
  await db.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status },
  });

  if (!existing && status === "GOING") {
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
    await notify({
      userId: event.organizerId,
      actorId: userId,
      type: "EVENT_RSVP",
      title: "New RSVP",
      body: `${user?.name ?? "Someone"} is going to ${event.title}.`,
      link: `/events/${event.slug}`,
    });
  }
}

export async function listUserEvents(userId: string) {
  const [organized, attending] = await Promise.all([
    db.event.findMany({ where: { organizerId: userId }, select: eventCardSelect, orderBy: { startsAt: "desc" }, take: 50 }),
    db.event.findMany({
      where: { attendees: { some: { userId } }, organizerId: { not: userId }, visibility: "PUBLIC" },
      select: eventCardSelect,
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
  ]);
  return { organized, attending };
}
