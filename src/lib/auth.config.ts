import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./roles";

/**
 * Edge-compatible auth config — used by middleware only.
 * Does NOT import users.ts (which uses Node crypto).
 * The actual authorize logic lives in auth.ts (Node runtime).
 *
 * sessionVersion is stored in the JWT so the Node-runtime jwt callback
 * in auth.ts can periodically verify it against the DB to support
 * session revocation (password change, team removal).
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
        const u = user as { companyId?: string; role?: UserRole; sessionVersion?: number };
        if (u.companyId) (token as { companyId?: string }).companyId = u.companyId;
        if (u.role) (token as { role?: UserRole }).role = u.role;
        // Store session version at login time so revocation can be detected
        (token as { sessionVersion?: number }).sessionVersion = u.sessionVersion ?? 1;
        // Record when this token was last DB-verified (epoch ms)
        (token as { dbCheckedAt?: number }).dbCheckedAt = Date.now();
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
        (session.user as { role?: UserRole }).role =
          ((token as { role?: UserRole }).role ?? "owner") as UserRole;
      }
      return session;
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "dev-only-secret-not-for-production"),
};
