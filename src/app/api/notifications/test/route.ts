import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/services/email";
import { sendTestTelegram } from "@/lib/services/telegram";

export async function POST(request: Request) {
  const body = (await request.json()) as { channel: "email" | "telegram" };

  if (body.channel === "email") {
    const result = await sendTestEmail();
    return NextResponse.json(result);
  }

  if (body.channel === "telegram") {
    const result = await sendTestTelegram();
    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: "Invalid channel. Use 'email' or 'telegram'" },
    { status: 400 }
  );
}
