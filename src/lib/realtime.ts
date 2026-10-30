import "server-only";
import { db } from "./supabase";

export const SCORE_CHANNEL = "marcador";
export const SCORE_EVENT = "cambio";

/**
 * Avisa a las pantallas del marcador de que hay una versión nueva. Solo se envía el número de versión:
 * las pantallas piden los datos a /api/marcador, así que un aviso falso no puede cambiar lo que se ve.
 * Nunca lanza: si Supabase Realtime no responde, las pantallas lo recogen con su sondeo de respaldo.
 */
export async function notifyScoreChange(version: number | null | undefined): Promise<void> {
  if (!version) return;
  const channel = db().channel(SCORE_CHANNEL);
  try {
    await channel.httpSend(SCORE_EVENT, { v: version }, { timeout: 4000 });
  } catch (err) {
    console.error("Aviso de tiempo real no enviado:", err instanceof Error ? err.message : err);
  } finally {
    void db().removeChannel(channel);
  }
}
