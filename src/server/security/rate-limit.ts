import "server-only";
import { headers } from "next/headers";
import { AppError } from "@/server/errors";

/**
 * Fixed-window in-memory rate limiter. Suitable for a single instance; swap the
 * store for Redis/Upstash when running multiple instances.
 */
type Bucket = { count: number; resetAt: number };
const store: Map<string, Bucket> = ((globalThis as { __rateLimitStore?: Map<string, Bucket> }).__rateLimitStore ??=
  new Map());

export const LIMITS = {
  auth: { limit: 10, windowMs: 15 * 60_000 },
  passwordReset: { limit: 5, windowMs: 60 * 60_000 },
  message: { limit: 40, windowMs: 60_000 },
  upload: { limit: 60, windowMs: 10 * 60_000 },
  create: { limit: 20, windowMs: 60 * 60_000 },
  interaction: { limit: 120, windowMs: 60_000 },
  report: { limit: 10, windowMs: 60 * 60_000 },
} as const;

export function checkRateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    if (store.size > 50_000) {
      for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
    }
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { success: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Throws a user-friendly AppError when the caller exceeds the limit. */
export async function enforceRateLimit(action: keyof typeof LIMITS, identity?: string) {
  const id = identity ?? (await clientIp());
  const result = checkRateLimit(`${action}:${id}`, LIMITS[action]);
  if (!result.success) {
    throw new AppError("You're doing that too often. Please wait a moment and try again.", "RATE_LIMITED");
  }
}
