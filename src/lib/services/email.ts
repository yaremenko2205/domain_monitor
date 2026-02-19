import nodemailer from "nodemailer";
import { getSettings } from "@/lib/config";
import type { AppSettings } from "@/types";

export async function sendEmailNotification(
  subject: string,
  htmlBody: string,
  textBody: string,
  s: AppSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!s.smtp_host || !s.smtp_user) {
      return { success: false, error: "SMTP not configured" };
    }

    const recipients: string[] = JSON.parse(s.email_recipients || "[]");
    if (recipients.length === 0) {
      return { success: false, error: "No email recipients configured" };
    }

    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port: Number(s.smtp_port) || 587,
      secure: Number(s.smtp_port) === 465,
      auth: {
        user: s.smtp_user,
        pass: s.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: s.smtp_from || "Domain Monitor <noreply@example.com>",
      to: recipients.join(", "),
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    return { success: false, error: message };
  }
}

export async function sendTestEmail(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const s = getSettings(userId);
  return sendEmailNotification(
    "Domain Monitor - Test Email",
    "<h2>Test Notification</h2><p>Email notifications are working correctly.</p>",
    "Test Notification\n\nEmail notifications are working correctly.",
    s
  );
}
