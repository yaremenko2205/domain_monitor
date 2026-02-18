import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/config";

export async function GET() {
  const s = getSettings();
  // Mask sensitive values for display
  const masked = { ...s };
  if (masked.smtp_pass) {
    masked.smtp_pass = "••••••••";
  }
  if (masked.telegram_bot_token) {
    masked.telegram_bot_token =
      masked.telegram_bot_token.substring(0, 8) + "••••••••";
  }
  return NextResponse.json(masked);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Record<string, string>;

  // Don't overwrite with masked values
  const updates: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === "••••••••" || value.endsWith("••••••••")) continue;
    updates[key] = value;
  }

  setSettings(updates);
  return NextResponse.json({ success: true });
}
