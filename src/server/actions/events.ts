"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireUser } from "@/server/auth-guard";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { createEvent, setRsvp } from "@/server/services/events";
import type { EventInput } from "@/lib/validation";

export async function createEventAction(input: EventInput) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("create", user.id);
    const event = await createEvent(user.id, input);
    revalidatePath("/events");
    revalidatePath("/");
    return event;
  }, "Your event has been created!");
}

export async function rsvpAction(eventId: string, status: "GOING" | "INTERESTED" | null) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("interaction", user.id);
    await setRsvp(user.id, z.string().min(1).max(40).parse(eventId), z.enum(["GOING", "INTERESTED"]).nullable().parse(status));
    revalidatePath("/events/[slug]", "page");
  });
}
