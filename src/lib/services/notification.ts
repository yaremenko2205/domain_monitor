import { db } from "@/lib/db";
import { notificationLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendEmailNotification } from "./email";
import { sendTelegramNotification } from "./telegram";
import { getSettings } from "@/lib/config";

interface DomainRecord {
  id: number;
  domain: string;
  expiryDate: string | null;
}

export async function processNotifications(
  domain: DomainRecord,
  daysLeft: number
): Promise<void> {
  const s = getSettings();
  const thresholds: number[] = JSON.parse(
    s.notification_thresholds || "[60,30,14,7,1]"
  );

  // Find the highest threshold this domain falls under
  const applicableThreshold = thresholds
    .sort((a, b) => b - a)
    .find((t) => daysLeft <= t);

  if (!applicableThreshold) return;

  // Check if we already notified for this domain at this threshold
  const existingLog = db
    .select()
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.domainId, domain.id),
        eq(notificationLog.thresholdDays, applicableThreshold),
        eq(notificationLog.success, true)
      )
    )
    .get();

  if (existingLog) return;

  const subject = `Domain Expiring: ${domain.domain} (${daysLeft} days left)`;
  const htmlBody = buildHtmlMessage(domain, daysLeft);
  const textBody = `Domain: ${domain.domain}\nDays until expiry: ${daysLeft}\nExpiry date: ${domain.expiryDate || "unknown"}`;

  // Send via enabled channels
  if (s.email_enabled === "true") {
    const result = await sendEmailNotification(subject, htmlBody, textBody);
    logNotification(
      domain.id,
      "email",
      applicableThreshold,
      subject,
      result
    );
  }

  if (s.telegram_enabled === "true") {
    const telegramMsg = `<b>${domain.domain}</b>\nExpires in <b>${daysLeft} days</b>\n(${domain.expiryDate || "unknown"})`;
    const result = await sendTelegramNotification(telegramMsg);
    logNotification(
      domain.id,
      "telegram",
      applicableThreshold,
      telegramMsg,
      result
    );
  }
}

function logNotification(
  domainId: number,
  channel: "email" | "telegram",
  thresholdDays: number,
  message: string,
  result: { success: boolean; error?: string }
): void {
  db.insert(notificationLog)
    .values({
      domainId,
      channel,
      thresholdDays,
      message,
      success: result.success,
      error: result.error || null,
      sentAt: new Date().toISOString(),
    })
    .run();
}

function buildHtmlMessage(
  domain: DomainRecord,
  daysLeft: number
): string {
  const urgency =
    daysLeft <= 7
      ? "color: #dc2626; font-weight: bold"
      : daysLeft <= 30
        ? "color: #d97706; font-weight: bold"
        : "color: #16a34a";

  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="margin-bottom: 16px;">Domain Expiration Alert</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Domain</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${domain.domain}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Days Left</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><span style="${urgency}">${daysLeft} days</span></td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Expiry Date</td>
          <td style="padding: 8px;">${domain.expiryDate ? new Date(domain.expiryDate).toLocaleDateString() : "Unknown"}</td>
        </tr>
      </table>
      <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Sent by Domain Monitor</p>
    </div>
  `;
}
