import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { reportSchema } from "@/lib/validation";
import type { z } from "zod";

export async function fileReport(reporterId: string, raw: z.input<typeof reportSchema>) {
  const input = reportSchema.parse(raw);
  const targets = [input.vehicleId, input.eventId, input.targetUserId, input.reviewId].filter(Boolean);
  if (targets.length !== 1) throw new AppError("Choose what you're reporting.");
  const duplicate = await db.report.findFirst({
    where: {
      reporterId,
      status: "OPEN",
      vehicleId: input.vehicleId ?? null,
      eventId: input.eventId ?? null,
      targetUserId: input.targetUserId ?? null,
      reviewId: input.reviewId ?? null,
    },
    select: { id: true },
  });
  if (duplicate) return;
  await db.report.create({ data: { reporterId, ...input } });
}
