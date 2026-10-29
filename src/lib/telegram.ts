import "server-only";
import { formatTime } from "./format";

/** Envía un aviso a Telegram. Nunca lanza: si falla, el escaneo ya está guardado. */
export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("Telegram error", res.status, await res.text());
    }
  } catch (err) {
    console.error("Telegram error", err);
  }
}

export function scanMessage(player: string, team: string, point: string, at: string): string {
  return `👻 ${player} (${team}) ha escaneado «${point}» · ${formatTime(at)}`;
}

export function joinMessage(player: string, team: string, created: boolean): string {
  return created
    ? `🎃 ${player} ha creado el equipo «${team}»`
    : `🦇 ${player} se ha unido al equipo «${team}»`;
}
