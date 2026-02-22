import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// ============================================================
// NextAuth.js tables (required by @auth/drizzle-adapter)
// ============================================================

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role", { enum: ["admin", "user", "viewer"] })
    .default("user")
    .notNull(),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [
    primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  ]
);

// ============================================================
// Application tables
// ============================================================

export const domains = sqliteTable("domains", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  registrar: text("registrar"),
  creationDate: text("creation_date"),
  expiryDate: text("expiry_date"),
  lastChecked: text("last_checked"),
  whoisRaw: text("whois_raw"),
  status: text("status", {
    enum: ["active", "expiring_soon", "expired", "unknown", "error"],
  })
    .default("unknown")
    .notNull(),
  notes: text("notes"),
  ownerAccount: text("owner_account"),
  paymentMethod: text("payment_method"),
  paymentMethodExpiry: text("payment_method_expiry"),
  passboltUrl: text("passbolt_url"),
  enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const domainShares = sqliteTable("domain_shares", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domainId: integer("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  sharedWithUserId: text("shared_with_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission", {
    enum: ["read", "edit", "full_control"],
  }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const notificationLog = sqliteTable("notification_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domainId: integer("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["email", "telegram"] }).notNull(),
  thresholdDays: integer("threshold_days").notNull(),
  message: text("message").notNull(),
  sentAt: text("sent_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  success: integer("success", { mode: "boolean" }).notNull(),
  error: text("error"),
});

export const userSettings = sqliteTable(
  "user_settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.key],
    }),
  ]
);

export const systemSettings = sqliteTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
