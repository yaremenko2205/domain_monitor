import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Transfer legacy domains to the first admin user
      const legacyEmail = process.env.LEGACY_ADMIN_EMAIL;
      if (legacyEmail && user.email === legacyEmail && user.id) {
        const legacyDomains = db
          .select()
          .from(schema.domains)
          .where(eq(schema.domains.userId, "legacy-admin"))
          .all();

        if (legacyDomains.length > 0) {
          db.update(schema.domains)
            .set({ userId: user.id })
            .where(eq(schema.domains.userId, "legacy-admin"))
            .run();

          db.update(schema.userSettings)
            .set({ userId: user.id })
            .where(eq(schema.userSettings.userId, "legacy-admin"))
            .run();

          console.log(
            `[Auth] Transferred ${legacyDomains.length} legacy domains to ${user.email}`
          );
        }
      }
    },
  },
});
