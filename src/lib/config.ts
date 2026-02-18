import { db } from "@/lib/db";
import { settings, domains } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

export function getSettings(): AppSettings {
  const rows = db.select().from(settings).all();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map as AppSettings;
}

export function getSetting(key: string): string {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date().toISOString() },
    })
    .run();
}

export function setSettings(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) {
    setSetting(key, value);
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

export function exportDomainsToJson(): DomainExportFile {
  const allDomains = db.select().from(domains).all();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    domains: allDomains.map((d) => ({
      domain: d.domain,
      notes: d.notes || undefined,
      enabled: d.enabled,
    })),
  };
}

export function importDomainsFromJson(
  entries: DomainExportEntry[]
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
      .where(eq(domains.domain, domainName))
      .get();

    if (existing) {
      skipped++;
      continue;
    }

    db.insert(domains)
      .values({
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
