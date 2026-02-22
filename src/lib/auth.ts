import NextAuth from "next-auth";
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
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || "common"}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
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
        // Read role from database
        const dbUser = db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .get();
        session.user.role = (dbUser?.role as "admin" | "user" | "viewer") || "user";
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
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

      if (user.id) {
        // Check if this is the first user ever — make them admin
        const allUsers = db.select().from(schema.users).all();
        if (allUsers.length <= 1) {
          db.update(schema.users)
            .set({ role: "admin" })
            .where(eq(schema.users.id, user.id))
            .run();
          console.log(
            `[Auth] First user ${user.email} promoted to admin`
          );
          return;
        }

        // For Entra ID users, resolve role from group claims
        if (account?.provider === "microsoft-entra-id" && profile) {
          const groups = (profile as Record<string, unknown>).groups;
          if (Array.isArray(groups)) {
            const { resolveRoleFromGroups, getSystemSetting } = await import(
              "@/lib/roles"
            );
            const resolvedRole = resolveRoleFromGroups(groups as string[]);
            if (resolvedRole) {
              db.update(schema.users)
                .set({ role: resolvedRole })
                .where(eq(schema.users.id, user.id))
                .run();
              console.log(
                `[Auth] Role for ${user.email} resolved from group claims: ${resolvedRole}`
              );
            } else {
              // Apply default role if configured and user doesn't already have admin
              const currentUser = db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, user.id))
                .get();
              if (currentUser?.role !== "admin") {
                const defaultRole = getSystemSetting("default_role") as "admin" | "user" | "viewer" | null;
                if (defaultRole) {
                  db.update(schema.users)
                    .set({ role: defaultRole })
                    .where(eq(schema.users.id, user.id))
                    .run();
                }
              }
            }
          }
        }
      }
    },
  },
});
