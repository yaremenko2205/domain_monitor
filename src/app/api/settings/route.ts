import { NextResponse } from "next/server";
import { getSettings, setSettings } from "@/lib/config";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { id: userId } = await requireAdmin();
    const s = getSettings(userId);
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
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}

export async function PUT(request: Request) {
  try {
    const { id: userId } = await requireAdmin();
    const body = (await request.json()) as Record<string, string>;

    // Don't overwrite with masked values
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value === "••••••••" || value.endsWith("••••••••")) continue;
      updates[key] = value;
    }

    setSettings(userId, updates);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
