import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration shared by the proxy (route protection) and the
 * full server configuration in `auth.ts`. Must not import Prisma or bcrypt.
 */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/sell",
  "/messages",
  "/favorites",
  "/notifications",
  "/settings",
  "/events/new",
  "/trades",
  "/admin",
];

export const authConfig = {
  pages: { signIn: "/sign-in", error: "/sign-in" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (!needsAuth) return true;
      if (!auth?.user) return false;
      if (pathname.startsWith("/admin") && auth.user.role !== "ADMIN") {
        return Response.redirect(new URL("/", request.nextUrl));
      }
      return true;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role ?? "USER";
        session.user.username = token.username ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
