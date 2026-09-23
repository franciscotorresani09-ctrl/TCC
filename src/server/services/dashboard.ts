import "server-only";
import { db } from "@/server/db";

export async function getDashboardOverview(userId: string) {
  const [activeListings, views, favorites, unreadMessages, conversations, pendingOffers, pendingTrades, soldCount] = await Promise.all([
    db.vehicle.count({ where: { sellerId: userId, status: "ACTIVE" } }),
    db.vehicle.aggregate({ where: { sellerId: userId, status: { not: "REMOVED" } }, _sum: { views: true } }),
    db.favorite.count({ where: { vehicle: { sellerId: userId, status: { not: "REMOVED" } } } }),
    db.message.count({ where: { receiverId: userId, readAt: null } }),
    db.conversation.count({ where: { participants: { some: { userId } } } }),
    db.offer.count({ where: { sellerId: userId, status: "PENDING" } }),
    db.tradeProposal.count({ where: { receiverId: userId, status: "PENDING" } }),
    db.vehicle.count({ where: { sellerId: userId, status: "SOLD" } }),
  ]);
  return {
    activeListings,
    views: views._sum.views ?? 0,
    favorites,
    unreadMessages,
    conversations,
    pendingOffers,
    pendingTrades,
    soldCount,
  };
}
