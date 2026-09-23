import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { AppError } from "@/server/errors";
import { forgotPasswordSchema, resetPasswordSchema, signUpSchema, passwordSchema } from "@/lib/validation";
import { absoluteUrl } from "@/lib/utils";
import type { z } from "zod";

const BCRYPT_COST = 12;
const RESET_TTL_MS = 60 * 60 * 1000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function registerUser(raw: z.input<typeof signUpSchema>) {
  const input = signUpSchema.parse(raw);
  const [emailTaken, usernameTaken] = await Promise.all([
    db.user.findUnique({ where: { email: input.email }, select: { id: true } }),
    db.user.findUnique({ where: { username: input.username }, select: { id: true } }),
  ]);
  if (emailTaken) throw new AppError("An account with this email already exists.", "CONFLICT");
  if (usernameTaken) throw new AppError("That username is taken. Try another one.", "CONFLICT");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  return db.user.create({
    data: { name: input.name, username: input.username, email: input.email, passwordHash },
    select: { id: true, email: true },
  });
}

/**
 * Creates a single-use reset token. Only the SHA-256 hash is stored. Always
 * resolves the same way whether or not the email exists (no account enumeration).
 */
export async function requestPasswordReset(raw: z.input<typeof forgotPasswordSchema>) {
  const { email } = forgotPasswordSchema.parse(raw);
  const user = await db.user.findUnique({ where: { email }, select: { id: true, isBanned: true } });
  if (!user || user.isBanned) return;

  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  const link = absoluteUrl(`/reset-password?token=${token}`);
  await sendPasswordResetEmail(email, link);
}

async function sendPasswordResetEmail(email: string, link: string) {
  // Plug in your email provider (Resend, SES, Postmark...) here.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[street-car] Password reset link for ${email}: ${link}`);
  }
}

export async function resetPassword(raw: z.input<typeof resetPasswordSchema>) {
  const input = resetPasswordSchema.parse(raw);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(input.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("This reset link is invalid or has expired. Request a new one.");
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}

export async function changePassword(userId: string, current: string, next: string) {
  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? "Invalid password.");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  if (user.passwordHash && !(await bcrypt.compare(current, user.passwordHash))) {
    throw new AppError("Your current password is incorrect.");
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, BCRYPT_COST) } });
}
