"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireUser } from "@/server/auth-guard";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { toggleFavorite } from "@/server/services/favorites";
import { addGarageVehicle, createReview, removeGarageVehicle, toggleFollow, updateProfile } from "@/server/services/users";
import { markNotificationsRead } from "@/server/services/notifications";
import { changePassword } from "@/server/services/account";

const id = z.string().min(1).max(40);

export async function toggleFavoriteAction(kind: "vehicle" | "event" | "seller", targetId: string) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("interaction", user.id);
    const favorited = await toggleFavorite(user.id, z.enum(["vehicle", "event", "seller"]).parse(kind), id.parse(targetId));
    revalidatePath("/favorites");
    return { favorited };
  });
}

export async function toggleFollowAction(targetUserId: string) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("interaction", user.id);
    const following = await toggleFollow(user.id, id.parse(targetUserId));
    return { following };
  });
}

export async function createReviewAction(input: { targetUserId: string; rating: number; comment: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("create", user.id);
    await createReview(user.id, input);
    revalidatePath("/u/[username]", "page");
  }, "Thanks! Your review has been posted.");
}

export async function markNotificationsReadAction(ids?: string[]) {
  return run(async () => {
    const user = await requireUser();
    await markNotificationsRead(user.id, ids ? z.array(id).max(200).parse(ids) : undefined);
  });
}

export async function updateProfileAction(input: { name: string; bio?: string; city?: string; state?: string; country?: string; image?: string }) {
  return run(async () => {
    const user = await requireUser();
    await updateProfile(user.id, input);
    revalidatePath("/settings");
    if (user.username) revalidatePath(`/u/${user.username}`);
  }, "Profile saved.");
}

export async function changePasswordAction(input: { current: string; next: string }) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("auth", user.id);
    await changePassword(user.id, String(input.current ?? "").slice(0, 128), String(input.next ?? ""));
  }, "Password updated.");
}

export async function addGarageVehicleAction(input: { make: string; model: string; year: number; image?: string; notes?: string }) {
  return run(async () => {
    const user = await requireUser();
    await addGarageVehicle(user.id, input);
    if (user.username) revalidatePath(`/u/${user.username}`);
  }, "Added to your garage.");
}

export async function removeGarageVehicleAction(garageId: string) {
  return run(async () => {
    const user = await requireUser();
    await removeGarageVehicle(user.id, id.parse(garageId));
    if (user.username) revalidatePath(`/u/${user.username}`);
  });
}
