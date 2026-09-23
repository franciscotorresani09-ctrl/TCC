/**
 * Errors that are safe to show to users. Anything else is logged and replaced
 * with a generic message so raw technical details never reach the UI.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "RATE_LIMITED" | "CONFLICT" = "INVALID",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const GENERIC_ERROR = "Something went wrong. Please try again.";

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function toActionError(err: unknown): { ok: false; error: string } {
  if (err instanceof AppError) return { ok: false, error: err.message };
  console.error("[street-car] unexpected error", err);
  return { ok: false, error: GENERIC_ERROR };
}
