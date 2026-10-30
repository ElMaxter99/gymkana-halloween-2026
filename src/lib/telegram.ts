import "server-only";
import { formatHourMinute } from "./format";

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
      // No se registra el cuerpo ni la URL: contiene el token del bot.
      console.error(`Telegram respondió ${res.status}`);
    }
  } catch (err) {
    console.error("Telegram no disponible:", err instanceof Error ? err.name : "error");
  }
}

export function scanMessage(scan: {
  player: string;
  team: string;
  point: string;
  at: string;
  teamScansOfPoint: number;
  offRoute?: boolean;
}): string {
  const lines = [
    "🎃 NUEVO ESCANEO",
    `👥 Equipo: ${scan.team}`,
    `🧙 Jugador: ${scan.player}`,
    `📍 Punto: ${scan.point}`,
    `🕒 Hora: ${formatHourMinute(scan.at)}`,
  ];
  if (scan.offRoute) {
    lines.push("⚠️ Este QR no está en la ruta de su equipo");
  }
  if (scan.teamScansOfPoint > 1) {
    lines.push(`🔁 Repetido: ${scan.teamScansOfPoint}.º escaneo del equipo en este punto`);
  }
  return lines.join("\n");
}

export function joinMessage(player: string, team: string): string {
  return `🦇 NUEVO JUGADOR\n👥 Equipo: ${team}\n🧙 Jugador: ${player}`;
}
