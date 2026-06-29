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
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile" } }
  })]
});

export class UnauthorizedError extends Error {}
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError("Chưa đăng nhập");
  return id;
}
