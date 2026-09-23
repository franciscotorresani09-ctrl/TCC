import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppError } from "@/server/errors";

export type SessionUser = { id: string; role: "USER" | "ADMIN"; username: string | null; name?: string | null; image?: string | null; email?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user?.id ? (session.user as SessionUser) : null;
}

/** For server actions / route handlers: throws a friendly error when signed out. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError("Please sign in to continue.", "UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AppError("You don't have permission to do that.", "FORBIDDEN");
  return user;
}

/** For pages: redirects to sign-in, preserving where the user was headed. */
export async function requireUserPage(callbackUrl: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

export async function requireAdminPage() {
  const user = await requireUserPage("/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
