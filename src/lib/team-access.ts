import "server-only";
import { db } from "./supabase";
import { verifyJoinCode } from "./crypto";
import { isUuid } from "./validation";

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 5;

export type TeamAccess =
  | { ok: true; team: { id: string; name: string } }
  | { ok: false; error: string; status: number };

/**
 * Comprueba que el equipo existe y, si tiene código, que es correcto.
 * Los fallos cuentan para el bloqueo (8 seguidos → 5 minutos). Lo usan el registro,
 * la lista de jugadores de «Ya me registré» y la entrada como jugador existente.
 */
export async function checkTeamAccess(teamId: unknown, joinCode: unknown): Promise<TeamAccess> {
  if (!isUuid(teamId)) return { ok: false, error: "Elige tu equipo.", status: 400 };
  const code = typeof joinCode === "string" ? joinCode.trim().slice(0, 40) : "";

  const supabase = db();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id, name, join_code_hash, failed_join_attempts, locked_until, active")
    .eq("id", teamId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return { ok: false, error: "No se pudo comprobar el equipo. Inténtalo de nuevo.", status: 500 };
  }
  if (!team || !team.active) return { ok: false, error: "Ese equipo no está disponible.", status: 404 };

  if (team.join_code_hash) {
    if (team.locked_until && new Date(team.locked_until) > new Date()) {
      return {
        ok: false,
        error: `Demasiados intentos fallidos. Espera ${LOCK_MINUTES} minutos o pide el código al organizador.`,
        status: 429,
      };
    }
    if (!code) return { ok: false, error: "Escribe el código de tu equipo.", status: 400 };
    if (!verifyJoinCode(code, team.join_code_hash)) {
      const attempts = team.failed_join_attempts + 1;
      const lock = attempts >= MAX_FAILED_ATTEMPTS;
      await supabase
        .from("teams")
        .update({
          failed_join_attempts: lock ? 0 : attempts,
          locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : team.locked_until,
        })
        .eq("id", team.id);
      return { ok: false, error: "El código no es correcto. Lo tenéis en la hoja de vuestro equipo.", status: 403 };
    }
    if (team.failed_join_attempts > 0) {
      await supabase.from("teams").update({ failed_join_attempts: 0 }).eq("id", team.id);
    }
  }
  return { ok: true, team: { id: team.id, name: team.name } };
}
