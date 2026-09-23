"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { run } from "@/server/actions/run";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { registerUser, requestPasswordReset, resetPassword } from "@/server/services/account";
import { signInSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/errors";

function safeCallback(url?: string | null) {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

const SIGN_IN_ERRORS: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  rate_limited: "Too many sign-in attempts. Please wait a few minutes and try again.",
  suspended: "This account has been suspended. Contact support for help.",
};

export async function signInAction(input: { email: string; password: string; callbackUrl?: string }): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email and password." };
  try {
    await enforceRateLimit("auth");
    await signIn("credentials", { ...parsed.data, redirect: false });
    return { ok: true, data: { redirectTo: safeCallback(input.callbackUrl) } };
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err as AuthError & { code?: string }).code;
      return { ok: false, error: (code && SIGN_IN_ERRORS[code]) || "Unable to sign in. Please try again." };
    }
    return run(async () => {
      throw err;
    });
  }
}

export async function signUpAction(input: { name: string; username: string; email: string; password: string }): Promise<ActionResult<{ redirectTo: string }>> {
  const result = await run(async () => {
    await enforceRateLimit("auth");
    await registerUser(input);
  });
  if (!result.ok) return result;
  try {
    await signIn("credentials", { email: input.email.trim().toLowerCase(), password: input.password, redirect: false });
  } catch {
    return { ok: true, data: { redirectTo: "/sign-in" } };
  }
  return { ok: true, data: { redirectTo: "/dashboard?welcome=1" } };
}

export async function oauthSignInAction(provider: "google" | "apple", callbackUrl?: string) {
  await signIn(provider, { redirectTo: safeCallback(callbackUrl) });
}

export async function forgotPasswordAction(input: { email: string }) {
  return run(async () => {
    await enforceRateLimit("passwordReset");
    await requestPasswordReset(input);
  }, "If an account exists for that email, we've sent a reset link.");
}

export async function resetPasswordAction(input: { token: string; password: string; confirmPassword: string }) {
  return run(async () => {
    await enforceRateLimit("passwordReset");
    await resetPassword(input);
  }, "Your password has been updated. You can sign in now.");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
