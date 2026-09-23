"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireUser } from "@/server/auth-guard";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { createVehicle, deleteVehicle, setVehicleStatus, updateVehicle } from "@/server/services/vehicles";
import { fileReport } from "@/server/services/reports";
import type { CreateVehicleInput } from "@/lib/validation";

const id = z.string().min(1).max(40);

export async function createVehicleAction(input: CreateVehicleInput) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("create", user.id);
    const v = await createVehicle(user.id, input);
    revalidatePath("/");
    revalidatePath("/marketplace");
    return v;
  }, "Your listing is live!");
}

export async function updateVehicleAction(vehicleId: string, input: CreateVehicleInput) {
  return run(async () => {
    const user = await requireUser();
    const v = await updateVehicle(user.id, id.parse(vehicleId), input);
    revalidatePath(`/vehicles/${v.slug}`);
    revalidatePath("/dashboard/listings");
    return v;
  }, "Listing updated.");
}

export async function setVehicleStatusAction(vehicleId: string, status: "ACTIVE" | "PAUSED" | "SOLD") {
  return run(async () => {
    const user = await requireUser();
    const parsed = z.enum(["ACTIVE", "PAUSED", "SOLD"]).parse(status);
    const v = await setVehicleStatus(user.id, id.parse(vehicleId), parsed);
    revalidatePath("/dashboard/listings");
    revalidatePath(`/vehicles/${v.slug}`);
    revalidatePath("/marketplace");
  }, status === "SOLD" ? "Marked as sold. Congratulations!" : status === "PAUSED" ? "Listing paused." : "Listing is live again.");
}

export async function deleteVehicleAction(vehicleId: string) {
  return run(async () => {
    const user = await requireUser();
    await deleteVehicle(user.id, id.parse(vehicleId));
    revalidatePath("/dashboard/listings");
    revalidatePath("/marketplace");
  }, "Listing deleted.");
}

export async function reportAction(input: {
  vehicleId?: string;
  eventId?: string;
  targetUserId?: string;
  reviewId?: string;
  reason: string;
  details?: string;
}) {
  return run(async () => {
    const user = await requireUser();
    await enforceRateLimit("report", user.id);
    await fileReport(user.id, input as Parameters<typeof fileReport>[1]);
  }, "Thanks for letting us know. Our team will review this report.");
}
