import { getSettings } from "@/lib/config";

const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramNotification(
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const s = getSettings();
    const botToken = s.telegram_bot_token;
    const chatId = s.telegram_chat_id;

    if (!botToken || !chatId) {
      return {
        success: false,
        error: "Telegram bot token or chat ID not configured",
      };
    }

    const url = `${TELEGRAM_API}/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { description?: string };
      return {
        success: false,
        error: errorData.description || "Telegram API error",
      };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Telegram send failed";
    return { success: false, error: msg };
  }
}

export async function sendTestTelegram(): Promise<{
  success: boolean;
  error?: string;
}> {
  return sendTelegramNotification(
    "<b>Domain Monitor</b>\n\nTest notification. Telegram is configured correctly."
  );
}
