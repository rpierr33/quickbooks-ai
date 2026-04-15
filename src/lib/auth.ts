import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, findUserById, verifyPassword } from "./users";
import { authConfig } from "./auth.config";
import { rateLimit } from "./rate-limit";
import type { UserRole } from "./roles";

/**
 * NextAuth v5 beta — Credentials provider backed by the user store in
 * `src/lib/users.ts`. Passwords are hashed via scrypt; see users.ts.
 *
 * Edge-safe config lives in auth.config.ts (no Node crypto imports).
 * This file extends it with the Credentials provider (Node runtime only).
 *
 * SESSION REVOCATION: The jwt callback checks the DB every 5 minutes to
 * verify the token's sessionVersion matches the user's current version.
 * If they differ (password changed, team removal), the callback returns null
 * which forces NextAuth to invalidate the session.
 */

const SESSION_REVALIDATION_MS = 5 * 60 * 1000; // 5 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On initial sign-in — populate token fields from the user object
      if (user) {
        const u = user as {
          id?: string;
          companyId?: string;
          role?: UserRole;
          sessionVersion?: number;
        };
        token.id = u.id;
        token.name = user.name;
        token.email = user.email;
        if (u.companyId) (token as { companyId?: string }).companyId = u.companyId;
        if (u.role) (token as { role?: UserRole }).role = u.role;
        // Store session version and initial DB-check timestamp
        (token as { sessionVersion?: number }).sessionVersion = u.sessionVersion ?? 1;
        (token as { dbCheckedAt?: number }).dbCheckedAt = Date.now();
        return token;
      }

      // On subsequent requests — periodically revalidate against DB
      const t = token as typeof token & {
        id?: string;
        sessionVersion?: number;
        dbCheckedAt?: number;
      };

      const now = Date.now();
      const lastCheck = t.dbCheckedAt ?? 0;
      const needsCheck = now - lastCheck > SESSION_REVALIDATION_MS;

      if (needsCheck && t.id) {
        const dbUser = await findUserById(t.id).catch(() => null);
        if (!dbUser) {
          // User was deleted — invalidate
          return null as unknown as typeof token;
        }
        const dbVersion = dbUser.session_version ?? 1;
        const tokenVersion = t.sessionVersion ?? 1;
        if (dbVersion !== tokenVersion) {
          // Session was revoked (password change or team removal)
          return null as unknown as typeof token;
        }
        // Update last-checked timestamp
        t.dbCheckedAt = now;
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Rate-limit by email: 10 attempts per 15-minute window
        const { allowed } = rateLimit(`login:${email}`, 10, 15 * 60 * 1000);
        if (!allowed) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;
        // Block pending (un-accepted invite) users from signing in
        if (user.status === "pending") return null;
        if (!verifyPassword(password, user.password_hash)) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.company_id,
          role: (user.role ?? "owner") as UserRole,
          sessionVersion: user.session_version ?? 1,
        } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
});
