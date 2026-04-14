import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, verifyPassword } from "./users";
import { authConfig } from "./auth.config";

/**
 * NextAuth v5 beta — Credentials provider backed by the user store in
 * `src/lib/users.ts`. Passwords are hashed via scrypt; see users.ts.
 *
 * Edge-safe config lives in auth.config.ts (no Node crypto imports).
 * This file extends it with the Credentials provider (Node runtime only).
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          role: user.role ?? "owner",
        } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
});
