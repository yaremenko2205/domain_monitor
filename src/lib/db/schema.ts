import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const domains = sqliteTable("domains", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domain: text("domain").notNull().unique(),
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
  enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
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

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
