import "server-only";
import type { MessageType, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { isOnline, publish } from "@/server/realtime/bus";
import { notify, countUnreadNotifications } from "@/server/services/notifications";
import { vehicleTitle } from "@/lib/utils";

const miniVehicle = {
  select: {
    id: true,
    slug: true,
    year: true,
    make: true,
    model: true,
    trim: true,
    price: true,
    status: true,
    city: true,
    state: true,
    images: { select: { url: true }, orderBy: { order: "asc" as const }, take: 1 },
  },
} as const;

export const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  receiverId: true,
  type: true,
  content: true,
  createdAt: true,
  readAt: true,
  vehicle: miniVehicle,
  offer: { select: { id: true, amount: true, counterAmount: true, status: true, buyerId: true, sellerId: true, vehicle: miniVehicle } },
  tradeProposal: {
    select: {
      id: true,
      status: true,
      cashDifference: true,
      counterCash: true,
      message: true,
      senderId: true,
      receiverId: true,
      offeredVehicle: miniVehicle,
      requestedVehicle: miniVehicle,
    },
  },
} satisfies Prisma.MessageSelect;

export type ChatMessage = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

const userMini = { select: { id: true, name: true, username: true, image: true, lastSeenAt: true } } as const;

export async function listConversations(userId: string, search?: string) {
  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId } },
      ...(search
        ? {
            OR: [
              { participants: { some: { userId: { not: userId }, user: { name: { contains: search, mode: "insensitive" } } } } },
              { vehicle: { OR: [{ make: { contains: search, mode: "insensitive" } }, { model: { contains: search, mode: "insensitive" } }] } },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true,
      lastMessageAt: true,
      vehicle: miniVehicle,
      participants: { select: { userId: true, lastReadAt: true, user: userMini } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, type: true, senderId: true, createdAt: true } },
    },
  });

  const unread = await db.message.groupBy({
    by: ["conversationId"],
    where: { receiverId: userId, readAt: null, conversationId: { in: conversations.map((c) => c.id) } },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversationId, u._count._all]));

  return conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== userId)?.user ?? null;
    return {
      id: c.id,
      lastMessageAt: c.lastMessageAt,
      vehicle: c.vehicle,
      other: other ? { ...other, online: isOnline(other.id) } : null,
      lastMessage: c.messages[0] ?? null,
      unread: unreadMap.get(c.id) ?? 0,
    };
  });
}
export type ConversationSummary = Awaited<ReturnType<typeof listConversations>>[number];

export async function getConversation(userId: string, conversationId: string) {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
    select: {
      id: true,
      vehicle: miniVehicle,
      participants: { select: { userId: true, lastReadAt: true, user: userMini } },
      messages: { orderBy: { createdAt: "asc" }, take: 200, select: messageSelect },
    },
  });
  if (!conversation) return null;
  const other = conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
  return {
    id: conversation.id,
    vehicle: conversation.vehicle,
    other: other ? { ...other, online: isOnline(other.id) } : null,
    messages: conversation.messages,
  };
}
export type ConversationDetail = NonNullable<Awaited<ReturnType<typeof getConversation>>>;

/** Find the 1:1 conversation between two users about a vehicle, creating it if needed. */
export async function findOrCreateConversation(userId: string, recipientId: string, vehicleId?: string | null) {
  if (userId === recipientId) throw new AppError("You can't message yourself.");
  const recipient = await db.user.findUnique({ where: { id: recipientId }, select: { id: true, isBanned: true } });
  if (!recipient || recipient.isBanned) throw new AppError("This user is unavailable.", "NOT_FOUND");

  const existing = await db.conversation.findFirst({
    where: {
      vehicleId: vehicleId ?? null,
      AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: recipientId } } }],
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await db.conversation.create({
    data: {
      vehicleId: vehicleId ?? null,
      participants: { create: [{ userId }, { userId: recipientId }] },
    },
    select: { id: true },
  });
  return created.id;
}

async function recipientOf(conversationId: string, senderId: string) {
  const participants = await db.conversationParticipant.findMany({ where: { conversationId }, select: { userId: true } });
  if (!participants.some((p) => p.userId === senderId)) throw new AppError("Conversation not found.", "NOT_FOUND");
  const other = participants.find((p) => p.userId !== senderId);
  if (!other) throw new AppError("Conversation not found.", "NOT_FOUND");
  return other.userId;
}

export async function postMessage(input: {
  conversationId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  vehicleId?: string;
  offerId?: string;
  tradeProposalId?: string;
  silent?: boolean;
}) {
  const receiverId = await recipientOf(input.conversationId, input.senderId);
  const now = new Date();
  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        receiverId,
        type: input.type ?? "TEXT",
        content: input.content,
        vehicleId: input.vehicleId,
        offerId: input.offerId,
        tradeProposalId: input.tradeProposalId,
      },
      select: messageSelect,
    }),
    db.conversation.update({ where: { id: input.conversationId }, data: { lastMessageAt: now } }),
    db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: input.conversationId, userId: input.senderId } },
      data: { lastReadAt: now },
    }),
  ]);

  publish(receiverId, { type: "message", conversationId: input.conversationId, message });
  publish(input.senderId, { type: "message", conversationId: input.conversationId, message });

  if (!input.silent && (input.type ?? "TEXT") === "TEXT") {
    const sender = await db.user.findUnique({ where: { id: input.senderId }, select: { name: true } });
    // Collapse chat notifications: only notify if there isn't already an unread one for this thread.
    const pending = await db.notification.findFirst({
      where: { userId: receiverId, type: "NEW_MESSAGE", readAt: null, link: `/messages/${input.conversationId}` },
      select: { id: true },
    });
    if (!pending) {
      await notify({
        userId: receiverId,
        actorId: input.senderId,
        type: "NEW_MESSAGE",
        title: `New message from ${sender?.name ?? "a Street-Car member"}`,
        body: input.content.slice(0, 140),
        link: `/messages/${input.conversationId}`,
      });
    }
  }
  await pushUnreadCounts(receiverId);
  return message;
}

export async function markConversationRead(userId: string, conversationId: string) {
  const now = new Date();
  const updated = await db.message.updateMany({
    where: { conversationId, receiverId: userId, readAt: null },
    data: { readAt: now },
  });
  await db.conversationParticipant.updateMany({ where: { conversationId, userId }, data: { lastReadAt: now } });
  await db.notification.updateMany({
    where: { userId, type: "NEW_MESSAGE", readAt: null, link: `/messages/${conversationId}` },
    data: { readAt: now },
  });
  if (updated.count > 0) {
    const otherId = await recipientOf(conversationId, userId).catch(() => null);
    if (otherId) publish(otherId, { type: "read", conversationId, readerId: userId, readAt: now.toISOString() });
  }
  await pushUnreadCounts(userId);
}

export async function pushUnreadCounts(userId: string) {
  const [messages, notifications] = await Promise.all([
    db.message.count({ where: { receiverId: userId, readAt: null } }),
    countUnreadNotifications(userId),
  ]);
  publish(userId, { type: "unread", messages, notifications });
}

export async function shareListing(userId: string, conversationId: string, vehicleId: string) {
  const vehicle = await db.vehicle.findFirst({
    where: { id: vehicleId, status: "ACTIVE" },
    select: { id: true, year: true, make: true, model: true, trim: true },
  });
  if (!vehicle) throw new AppError("Unable to load this listing.", "NOT_FOUND");
  return postMessage({
    conversationId,
    senderId: userId,
    type: "LISTING",
    content: `Shared a listing: ${vehicleTitle(vehicle)}`,
    vehicleId: vehicle.id,
  });
}

export async function getUnreadCounts(userId: string) {
  const [messages, notifications] = await Promise.all([
    db.message.count({ where: { receiverId: userId, readAt: null } }),
    countUnreadNotifications(userId),
  ]);
  return { messages, notifications };
}
