import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Route protection runs before rendering. Pages and server actions also verify
// the session themselves (defense in depth).
const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sell/:path*",
    "/messages/:path*",
    "/favorites/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/events/new",
    "/trades/:path*",
    "/admin/:path*",
  ],
};
