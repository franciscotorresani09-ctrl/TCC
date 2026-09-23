import "server-only";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";
import { toActionError, type ActionResult } from "@/server/errors";

/** Wraps a server action body: maps validation and app errors to safe results. */
export async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message };
  } catch (err) {
    // next/navigation redirects are implemented as thrown errors — rethrow them.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw err;
    }
    if (err instanceof ZodError) {
      const fields = fieldErrors(err);
      return { ok: false, error: Object.values(fields)[0] ?? "Please check the form and try again.", fieldErrors: fields };
    }
    return toActionError(err);
  }
}
