import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers";
import { db } from "@/server/db";
import { authConfig } from "@/auth.config";
import { signInSchema } from "@/lib/validation";
import { checkRateLimit, LIMITS } from "@/server/security/rate-limit";
import { generateUniqueUsername } from "@/server/services/users";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}
class AccountSuspended extends CredentialsSignin {
  code = "suspended";
}

const DUMMY_HASH = bcrypt.hashSync("street-car-timing-guard", 10);

export const oauthProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
};

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = signInSchema.safeParse(raw);
      if (!parsed.success) throw new InvalidCredentials();
      const { email, password } = parsed.data;

      if (!checkRateLimit(`signin:${email}`, LIMITS.auth).success) throw new TooManyAttempts();

      const user = await db.user.findUnique({ where: { email } });
      // Always run a bcrypt comparison to keep timing uniform for unknown emails.
      const hash = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(password, hash);
      if (!user || !user.passwordHash || !valid) throw new InvalidCredentials();
      if (user.isBanned) throw new AccountSuspended();

      return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, username: user.username };
    },
  }),
];
if (oauthProviders.google) providers.push(Google({ allowDangerousEmailAccountLinking: false }));
if (oauthProviders.apple) providers.push(Apple);

const REFRESH_INTERVAL_MS = 5 * 60_000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.id) return true;
      const record = await db.user.findUnique({ where: { id: user.id }, select: { isBanned: true } });
      return !record?.isBanned;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role ?? "USER";
        token.username = user.username ?? null;
        token.refreshedAt = Date.now();
      }
      const stale = !token.refreshedAt || Date.now() - token.refreshedAt > REFRESH_INTERVAL_MS;
      if (token.sub && (stale || trigger === "update")) {
        const fresh = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, username: true, name: true, image: true, isBanned: true },
        });
        if (!fresh || fresh.isBanned) return null;
        token.role = fresh.role;
        token.username = fresh.username;
        token.name = fresh.name;
        token.picture = fresh.image;
        token.refreshedAt = Date.now();
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // OAuth sign-ups don't provide a username; derive a unique one.
      if (user.id) {
        const username = await generateUniqueUsername(user.name ?? user.email?.split("@")[0] ?? "driver");
        await db.user.update({ where: { id: user.id }, data: { username } });
      }
    },
  },
});
