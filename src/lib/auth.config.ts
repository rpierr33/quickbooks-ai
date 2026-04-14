import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — used by middleware only.
 * Does NOT import users.ts (which uses Node crypto).
 * The actual authorize logic lives in auth.ts (Node runtime).
 */
export const authConfig: NextAuthConfig = {
  providers: [],
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
        (session.user as { companyId?: string }).companyId =
          (token as { companyId?: string }).companyId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-not-for-production'),
};
