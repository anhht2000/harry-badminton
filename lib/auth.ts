import { cache } from "react";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users, accountsTable: accounts,
    sessionsTable: sessions, verificationTokensTable: verificationTokens
  }),
  // JWT: khoi query DB session moi request (adapter van dung de link account Google).
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile" } }
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id as string;
      return session;
    }
  }
});

export class UnauthorizedError extends Error {}
// Dedupe session lookup trong 1 request: database strategy nen moi auth() la 1 query DB.
const getSession = cache(async () => auth());
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.email ?? null;
}
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError("Chưa đăng nhập");
  return id;
}
