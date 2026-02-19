import { db } from "@/lib/db";
import { userSettings, domains } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { AppSettings } from "@/types";

const DEFAULT_SETTINGS: Record<string, string> = {
  notification_thresholds: "[60,30,14,7,1]",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "Domain Monitor <noreply@example.com>",
  email_recipients: "[]",
  email_enabled: "false",
  telegram_bot_token: "",
  telegram_chat_id: "",
  telegram_enabled: "false",
  check_cron_schedule: "0 8 * * *",
};

export function getSettings(userId: string): AppSettings {
  const rows = db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .all();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map as AppSettings;
}

export function getSetting(userId: string, key: string): string {
  const row = db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
    .get();
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export function setSetting(userId: string, key: string, value: string): void {
  db.insert(userSettings)
    .values({ userId, key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: [userSettings.userId, userSettings.key],
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
}

export function setSettings(
  userId: string,
  entries: Record<string, string>
): void {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(userId, key, value);
  }
}

export interface DomainExportEntry {
  domain: string;
  notes?: string;
  enabled?: boolean;
}

export interface DomainExportFile {
  version: 1;
  exportedAt: string;
  domains: DomainExportEntry[];
}

export function exportDomainsToJson(userId: string): DomainExportFile {
  const userDomains = db
    .select()
    .from(domains)
    .where(eq(domains.userId, userId))
    .all();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    domains: userDomains.map((d) => ({
      domain: d.domain,
      notes: d.notes || undefined,
      enabled: d.enabled,
    })),
  };
}

export function importDomainsFromJson(
  entries: DomainExportEntry[],
  userId: string
): { imported: number; skipped: number } {
  let imported = 0;
  let skipped = 0;

  for (const entry of entries) {
    const domainName = entry.domain.toLowerCase().trim();
    if (!domainName) {
      skipped++;
      continue;
    }

    const existing = db
      .select()
      .from(domains)
      .where(and(eq(domains.domain, domainName), eq(domains.userId, userId)))
      .get();

    if (existing) {
      skipped++;
      continue;
    }

    db.insert(domains)
      .values({
        userId,
        domain: domainName,
        notes: entry.notes || null,
        enabled: entry.enabled ?? true,
        status: "unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
    imported++;
  }

  return { imported, skipped };
}
