import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      username: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role?: "USER" | "ADMIN";
    username?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
    username?: string | null;
    refreshedAt?: number;
    banned?: boolean;
  }
}
