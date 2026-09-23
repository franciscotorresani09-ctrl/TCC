"use server";

import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireUser } from "@/server/auth-guard";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { findOrCreateConversation, markConversationRead, postMessage, shareListing } from "@/server/services/messages";
import { sendMessageSchema, startConversationSchema } from "@/lib/validation";

export async function sendMessageAction(input: { conversationId: string; content: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("message", user.id);
    const data = sendMessageSchema.parse(input);
    return postMessage({ conversationId: data.conversationId, senderId: user.id, content: data.content });
  });
}

export async function startConversationAction(input: { recipientId: string; vehicleId?: string; content: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("message", user.id);
    const data = startConversationSchema.parse(input);
    const conversationId = await findOrCreateConversation(user.id, data.recipientId, data.vehicleId);
    await postMessage({ conversationId, senderId: user.id, content: data.content, vehicleId: data.vehicleId });
    return { conversationId };
  });
}

export async function markConversationReadAction(conversationId: string) {
  return run(async () => {
    const user = await requireUser();
    await markConversationRead(user.id, z.string().min(1).max(40).parse(conversationId));
  });
}

export async function shareListingAction(conversationId: string, vehicleId: string) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("message", user.id);
    return shareListing(user.id, z.string().max(40).parse(conversationId), z.string().max(40).parse(vehicleId));
  });
}
