import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { findUserByEmail, verifyPassword } from "./users";

/**
 * NextAuth v5 beta — Credentials provider backed by the user store in
 * `src/lib/users.ts`. Passwords are hashed via scrypt; see users.ts.
 *
 * The seeded demo account remains usable (email: demo@ledgr.com, pw: demo)
 * because the seeded row carries a real scrypt hash. Fresh signups go
 * through /api/auth/signup.
 */

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user) return null;
        if (!verifyPassword(password, user.password_hash)) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          companyId: user.company_id,
        } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.name = user.name;
        token.email = user.email;
        const u = user as { companyId?: string };
        if (u.companyId) (token as { companyId?: string }).companyId = u.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        // Attach companyId for downstream scoping
        (session.user as { companyId?: string }).companyId =
          (token as { companyId?: string }).companyId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-not-for-production'),
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
