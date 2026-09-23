import "server-only";
import type { OfferStatus, Prisma, TradeStatus } from "@prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { publish } from "@/server/realtime/bus";
import { findOrCreateConversation, postMessage } from "@/server/services/messages";
import { notify } from "@/server/services/notifications";
import { offerSchema, tradeProposalSchema } from "@/lib/validation";
import { formatPrice, formatSignedCash, vehicleTitle } from "@/lib/utils";
import type { z } from "zod";

// Offers and trade proposals — the "deal" side of Street-Car.

const dealVehicle = {
  select: {
    id: true,
    slug: true,
    year: true,
    make: true,
    model: true,
    trim: true,
    price: true,
    status: true,
    sellerId: true,
    images: { select: { url: true }, orderBy: { order: "asc" as const }, take: 1 },
  },
} as const;
const dealUser = { select: { id: true, name: true, username: true, image: true } } as const;

// ── Offers ──────────────────────────────────────────────────

export async function createOffer(buyerId: string, raw: z.input<typeof offerSchema>) {
  const input = offerSchema.parse(raw);
  const vehicle = await db.vehicle.findUnique({ where: { id: input.vehicleId }, select: dealVehicle.select });
  if (!vehicle || vehicle.status !== "ACTIVE") throw new AppError("This vehicle is no longer available.", "NOT_FOUND");
  if (vehicle.sellerId === buyerId) throw new AppError("You can't make an offer on your own listing.");

  const open = await db.offer.findFirst({
    where: { vehicleId: vehicle.id, buyerId, status: { in: ["PENDING", "COUNTERED"] } },
    select: { id: true },
  });
  if (open) throw new AppError("You already have an open offer on this vehicle.", "CONFLICT");

  const offer = await db.offer.create({
    data: { vehicleId: vehicle.id, buyerId, sellerId: vehicle.sellerId, amount: input.amount, message: input.message },
    select: { id: true },
  });

  const conversationId = await findOrCreateConversation(buyerId, vehicle.sellerId, vehicle.id);
  await postMessage({
    conversationId,
    senderId: buyerId,
    type: "OFFER",
    content: input.message ?? `Offered ${formatPrice(input.amount)} for the ${vehicleTitle(vehicle)}`,
    offerId: offer.id,
    vehicleId: vehicle.id,
  });
  await notify({
    userId: vehicle.sellerId,
    actorId: buyerId,
    type: "NEW_OFFER",
    title: "New offer received",
    body: `${formatPrice(input.amount)} for your ${vehicleTitle(vehicle)}`,
    link: `/dashboard/offers`,
  });
  return { offerId: offer.id, conversationId };
}

export type OfferAction = "accept" | "decline" | "counter" | "withdraw";

export async function respondToOffer(userId: string, offerId: string, action: OfferAction, counterAmount?: number) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { vehicle: dealVehicle },
  });
  if (!offer) throw new AppError("Offer not found.", "NOT_FOUND");
  const isSeller = offer.sellerId === userId;
  const isBuyer = offer.buyerId === userId;
  if (!isSeller && !isBuyer) throw new AppError("You don't have access to this offer.", "FORBIDDEN");

  let status: OfferStatus;
  let amount = offer.amount;
  let counter = offer.counterAmount;
  let summary: string;

  if (isSeller && offer.status === "PENDING" && action === "accept") {
    status = "ACCEPTED";
    summary = `accepted the offer of ${formatPrice(offer.amount)}`;
  } else if (isSeller && offer.status === "PENDING" && action === "decline") {
    status = "DECLINED";
    summary = `declined the offer of ${formatPrice(offer.amount)}`;
  } else if (isSeller && offer.status === "PENDING" && action === "counter") {
    if (!counterAmount || counterAmount <= 0) throw new AppError("Enter a counter amount.");
    status = "COUNTERED";
    counter = counterAmount;
    summary = `countered with ${formatPrice(counterAmount)}`;
  } else if (isBuyer && offer.status === "COUNTERED" && action === "accept") {
    status = "ACCEPTED";
    amount = offer.counterAmount ?? offer.amount;
    summary = `accepted the counter offer of ${formatPrice(amount)}`;
  } else if (isBuyer && offer.status === "COUNTERED" && action === "decline") {
    status = "DECLINED";
    summary = `declined the counter offer`;
  } else if (isBuyer && (offer.status === "PENDING" || offer.status === "COUNTERED") && action === "withdraw") {
    status = "WITHDRAWN";
    summary = `withdrew the offer`;
  } else {
    throw new AppError("This offer can't be updated anymore.", "CONFLICT");
  }

  await db.offer.update({ where: { id: offer.id }, data: { status, amount, counterAmount: counter } });

  const otherId = isSeller ? offer.buyerId : offer.sellerId;
  const actor = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  const conversationId = await findOrCreateConversation(offer.buyerId, offer.sellerId, offer.vehicleId);
  await postMessage({
    conversationId,
    senderId: userId,
    type: "SYSTEM",
    content: `${actor?.name ?? "The other party"} ${summary}.`,
    offerId: offer.id,
    silent: true,
  });
  await notify({
    userId: otherId,
    actorId: userId,
    type: "OFFER_UPDATED",
    title: status === "ACCEPTED" ? "Offer accepted 🎉" : "Offer updated",
    body: `${actor?.name ?? "Someone"} ${summary} on the ${vehicleTitle(offer.vehicle)}.`,
    link: `/messages/${conversationId}`,
  });
  publish(otherId, { type: "offer", offerId: offer.id });
  publish(userId, { type: "offer", offerId: offer.id });
}

export async function listOffers(userId: string) {
  const select = {
    id: true,
    amount: true,
    counterAmount: true,
    message: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    vehicle: dealVehicle,
    buyer: dealUser,
    seller: dealUser,
  } satisfies Prisma.OfferSelect;
  const [incoming, outgoing] = await Promise.all([
    db.offer.findMany({ where: { sellerId: userId }, select, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.offer.findMany({ where: { buyerId: userId }, select, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  return { incoming, outgoing };
}
export type OfferItem = Awaited<ReturnType<typeof listOffers>>["incoming"][number];

// ── Trades ──────────────────────────────────────────────────

export async function proposeTrade(senderId: string, raw: z.input<typeof tradeProposalSchema>) {
  const input = tradeProposalSchema.parse(raw);
  const [offered, requested] = await Promise.all([
    db.vehicle.findUnique({ where: { id: input.offeredVehicleId }, select: dealVehicle.select }),
    db.vehicle.findUnique({ where: { id: input.requestedVehicleId }, select: { ...dealVehicle.select, openToTrade: true } }),
  ]);
  if (!requested || requested.status !== "ACTIVE") throw new AppError("This vehicle is no longer available.", "NOT_FOUND");
  if (!requested.openToTrade) throw new AppError("This seller isn't accepting trades for this vehicle.");
  if (requested.sellerId === senderId) throw new AppError("You can't propose a trade on your own listing.");
  if (!offered || offered.sellerId !== senderId || !["ACTIVE", "PAUSED"].includes(offered.status)) {
    throw new AppError("Select one of your active vehicles to offer.");
  }

  const duplicate = await db.tradeProposal.findFirst({
    where: {
      senderId,
      offeredVehicleId: offered.id,
      requestedVehicleId: requested.id,
      status: { in: ["PENDING", "COUNTER_OFFER"] },
    },
    select: { id: true },
  });
  if (duplicate) throw new AppError("You already have an open proposal for this trade.", "CONFLICT");

  const trade = await db.tradeProposal.create({
    data: {
      senderId,
      receiverId: requested.sellerId,
      offeredVehicleId: offered.id,
      requestedVehicleId: requested.id,
      cashDifference: input.cashDifference,
      message: input.message,
    },
    select: { id: true },
  });

  const conversationId = await findOrCreateConversation(senderId, requested.sellerId, requested.id);
  await postMessage({
    conversationId,
    senderId,
    type: "TRADE",
    content: input.message ?? `Proposed a trade: ${vehicleTitle(offered)} for ${vehicleTitle(requested)}`,
    tradeProposalId: trade.id,
  });
  await notify({
    userId: requested.sellerId,
    actorId: senderId,
    type: "TRADE_PROPOSAL",
    title: "New trade proposal",
    body: `${vehicleTitle(offered)} (${formatSignedCash(input.cashDifference)}) for your ${vehicleTitle(requested)}`,
    link: `/dashboard/trades`,
  });
  return { tradeId: trade.id, conversationId };
}

export type TradeAction = "accept" | "decline" | "counter" | "cancel" | "complete";

export async function respondToTrade(userId: string, tradeId: string, action: TradeAction, counterCash?: number) {
  const trade = await db.tradeProposal.findUnique({
    where: { id: tradeId },
    include: { offeredVehicle: dealVehicle, requestedVehicle: dealVehicle },
  });
  if (!trade) throw new AppError("Trade proposal not found.", "NOT_FOUND");
  const isReceiver = trade.receiverId === userId;
  const isSender = trade.senderId === userId;
  if (!isReceiver && !isSender) throw new AppError("You don't have access to this trade.", "FORBIDDEN");

  let status: TradeStatus;
  let cash = trade.cashDifference;
  let counter = trade.counterCash;
  let summary: string;
  const s = trade.status;

  if (isReceiver && s === "PENDING" && action === "accept") {
    status = "ACCEPTED";
    summary = "accepted the trade proposal";
  } else if (isReceiver && s === "PENDING" && action === "decline") {
    status = "DECLINED";
    summary = "declined the trade proposal";
  } else if (isReceiver && s === "PENDING" && action === "counter") {
    if (counterCash === undefined || !Number.isFinite(counterCash)) throw new AppError("Enter a cash difference for your counter offer.");
    status = "COUNTER_OFFER";
    counter = Math.trunc(counterCash);
    summary = `sent a counter offer (${formatSignedCash(counter)})`;
  } else if (isSender && s === "COUNTER_OFFER" && action === "accept") {
    status = "ACCEPTED";
    cash = trade.counterCash ?? trade.cashDifference;
    summary = "accepted the counter offer";
  } else if (isSender && s === "COUNTER_OFFER" && action === "decline") {
    status = "DECLINED";
    summary = "declined the counter offer";
  } else if (isSender && (s === "PENDING" || s === "COUNTER_OFFER") && action === "cancel") {
    status = "CANCELLED";
    summary = "cancelled the trade proposal";
  } else if (s === "ACCEPTED" && action === "complete") {
    status = "COMPLETED";
    summary = "marked the trade as completed";
  } else {
    throw new AppError("This trade can't be updated anymore.", "CONFLICT");
  }

  await db.$transaction(async (tx) => {
    await tx.tradeProposal.update({ where: { id: trade.id }, data: { status, cashDifference: cash, counterCash: counter } });
    if (status === "COMPLETED") {
      await tx.vehicle.updateMany({
        where: { id: { in: [trade.offeredVehicleId, trade.requestedVehicleId] } },
        data: { status: "SOLD", soldAt: new Date() },
      });
    }
  });

  const otherId = isSender ? trade.receiverId : trade.senderId;
  const actor = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  const conversationId = await findOrCreateConversation(trade.senderId, trade.receiverId, trade.requestedVehicleId);
  await postMessage({
    conversationId,
    senderId: userId,
    type: "SYSTEM",
    content: `${actor?.name ?? "The other party"} ${summary}.`,
    tradeProposalId: trade.id,
    silent: true,
  });
  await notify({
    userId: otherId,
    actorId: userId,
    type: status === "ACCEPTED" ? "TRADE_ACCEPTED" : "TRADE_UPDATED",
    title: status === "ACCEPTED" ? "Trade accepted 🤝" : "Trade proposal updated",
    body: `${actor?.name ?? "Someone"} ${summary}: ${vehicleTitle(trade.offeredVehicle)} ⇄ ${vehicleTitle(trade.requestedVehicle)}.`,
    link: `/dashboard/trades`,
  });
  publish(otherId, { type: "trade", tradeId: trade.id });
  publish(userId, { type: "trade", tradeId: trade.id });
}

export async function listTrades(userId: string) {
  const select = {
    id: true,
    status: true,
    cashDifference: true,
    counterCash: true,
    message: true,
    createdAt: true,
    updatedAt: true,
    senderId: true,
    receiverId: true,
    sender: dealUser,
    receiver: dealUser,
    offeredVehicle: dealVehicle,
    requestedVehicle: dealVehicle,
  } satisfies Prisma.TradeProposalSelect;
  const [incoming, outgoing] = await Promise.all([
    db.tradeProposal.findMany({ where: { receiverId: userId }, select, orderBy: { updatedAt: "desc" }, take: 100 }),
    db.tradeProposal.findMany({ where: { senderId: userId }, select, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  return { incoming, outgoing };
}
export type TradeItem = Awaited<ReturnType<typeof listTrades>>["incoming"][number];
