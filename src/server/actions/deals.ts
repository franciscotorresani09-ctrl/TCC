"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireUser } from "@/server/auth-guard";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { createOffer, proposeTrade, respondToOffer, respondToTrade } from "@/server/services/deals";

const id = z.string().min(1).max(40);

export async function makeOfferAction(input: { vehicleId: string; amount: number; message?: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("create", user.id);
    const result = await createOffer(user.id, input);
    revalidatePath("/dashboard/offers");
    return result;
  }, "Offer sent! The seller has been notified.");
}

export async function respondToOfferAction(offerId: string, action: "accept" | "decline" | "counter" | "withdraw", amount?: number) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("interaction", user.id);
    const parsedAmount = amount === undefined ? undefined : z.number().int().min(1).max(50_000_000).parse(amount);
    await respondToOffer(user.id, id.parse(offerId), z.enum(["accept", "decline", "counter", "withdraw"]).parse(action), parsedAmount);
    revalidatePath("/dashboard/offers");
  }, "Offer updated.");
}

export async function proposeTradeAction(input: { offeredVehicleId: string; requestedVehicleId: string; cashDifference: number; message?: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("create", user.id);
    const result = await proposeTrade(user.id, input);
    revalidatePath("/dashboard/trades");
    return result;
  }, "Trade proposal sent!");
}

export async function respondToTradeAction(tradeId: string, action: "accept" | "decline" | "counter" | "cancel" | "complete", counterCash?: number) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("interaction", user.id);
    const cash = counterCash === undefined ? undefined : z.number().int().min(-10_000_000).max(10_000_000).parse(counterCash);
    await respondToTrade(user.id, id.parse(tradeId), z.enum(["accept", "decline", "counter", "cancel", "complete"]).parse(action), cash);
    revalidatePath("/dashboard/trades");
  }, "Trade updated.");
}
