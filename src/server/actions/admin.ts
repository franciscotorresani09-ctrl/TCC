"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { run } from "@/server/actions/run";
import { requireAdmin } from "@/server/auth-guard";
import {
  adminResolveReport,
  adminSetReviewHidden,
  adminSetUserBan,
  adminSetUserRole,
  adminUpdateCategory,
  adminUpdateEvent,
  adminUpdateVehicle,
} from "@/server/services/admin";

const id = z.string().min(1).max(40);

export async function adminBanUserAction(userId: string, banned: boolean) {
  return run(async () => {
    const admin = await requireAdmin();
    await adminSetUserBan(admin.id, id.parse(userId), z.boolean().parse(banned));
    revalidatePath("/admin/users");
  }, banned ? "User suspended." : "User reinstated.");
}

export async function adminSetRoleAction(userId: string, role: "USER" | "ADMIN") {
  return run(async () => {
    const admin = await requireAdmin();
    await adminSetUserRole(admin.id, id.parse(userId), z.enum(["USER", "ADMIN"]).parse(role));
    revalidatePath("/admin/users");
  }, "Role updated.");
}

export async function adminUpdateVehicleAction(vehicleId: string, data: { status?: "ACTIVE" | "PAUSED" | "REMOVED"; isFeatured?: boolean }) {
  return run(async () => {
    await requireAdmin();
    const parsed = z.object({ status: z.enum(["ACTIVE", "PAUSED", "REMOVED"]).optional(), isFeatured: z.boolean().optional() }).parse(data);
    await adminUpdateVehicle(id.parse(vehicleId), parsed);
    revalidatePath("/admin/listings");
    revalidatePath("/");
  }, "Listing updated.");
}

export async function adminUpdateEventAction(eventId: string, data: { status?: "ACTIVE" | "CANCELLED"; isFeatured?: boolean }) {
  return run(async () => {
    await requireAdmin();
    const parsed = z.object({ status: z.enum(["ACTIVE", "CANCELLED"]).optional(), isFeatured: z.boolean().optional() }).parse(data);
    await adminUpdateEvent(id.parse(eventId), parsed);
    revalidatePath("/admin/events");
    revalidatePath("/events");
  }, "Event updated.");
}

export async function adminResolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED") {
  return run(async () => {
    await requireAdmin();
    await adminResolveReport(id.parse(reportId), z.enum(["RESOLVED", "DISMISSED"]).parse(status));
    revalidatePath("/admin/reports");
  }, status === "RESOLVED" ? "Report resolved." : "Report dismissed.");
}

export async function adminSetReviewHiddenAction(reviewId: string, hidden: boolean) {
  return run(async () => {
    await requireAdmin();
    await adminSetReviewHidden(id.parse(reviewId), z.boolean().parse(hidden));
    revalidatePath("/admin/reviews");
  }, hidden ? "Review hidden." : "Review restored.");
}

export async function adminUpdateCategoryAction(categoryId: string, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
  return run(async () => {
    await requireAdmin();
    const parsed = z
      .object({ name: z.string().trim().min(2).max(40).optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().min(0).max(999).optional() })
      .parse(data);
    await adminUpdateCategory(id.parse(categoryId), parsed);
    revalidatePath("/admin/categories");
    revalidatePath("/");
  }, "Category updated.");
}
