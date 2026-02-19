import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/services/email";
import { sendTestTelegram } from "@/lib/services/telegram";
import { requireUserId } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = (await request.json()) as { channel: "email" | "telegram" };

    if (body.channel === "email") {
      const result = await sendTestEmail(userId);
      return NextResponse.json(result);
    }

    if (body.channel === "telegram") {
      const result = await sendTestTelegram(userId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid channel. Use 'email' or 'telegram'" },
      { status: 400 }
    );
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
}
