import { NextResponse, after } from "next/server";
import { db } from "@/lib/supabase";
import { randomToken, sha256, verifyJoinCode } from "@/lib/crypto";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE, getCurrentPlayer } from "@/lib/player";
import { joinMessage, notifyTelegram } from "@/lib/telegram";
import { cleanName, envInt, isUuid } from "@/lib/validation";

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 5;

type Body = {
  playerName?: unknown;
  teamId?: unknown;
  joinCode?: unknown;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Registra a un jugador en uno de los equipos fijos de la gymkana.
 * Si el organizador ha puesto código al equipo, hay que escribirlo.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Petición no válida");
  }

  const playerName = cleanName(body.playerName, 40);
  const joinCode = typeof body.joinCode === "string" ? body.joinCode.trim().slice(0, 40) : "";
  if (!playerName) return fail("Escribe tu nombre.");
  if (!isUuid(body.teamId)) return fail("Elige tu equipo.");

  // Evita registros duplicados por doble pulsación o por volver atrás:
  // para registrarse de nuevo hay que pulsar antes «No soy yo».
  const existing = await getCurrentPlayer();
  if (existing) {
    return fail(`Este móvil ya está registrado como ${existing.displayName} (${existing.teamName}).`, 409);
  }

  const supabase = db();
  const { data: team, error } = await supabase
    .from("teams")
    .select("id, name, join_code_hash, failed_join_attempts, locked_until, active")
    .eq("id", body.teamId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return fail("No se pudo comprobar el equipo. Inténtalo de nuevo.", 500);
  }
  if (!team || !team.active) return fail("Ese equipo no está disponible.", 404);

  if (team.join_code_hash) {
    if (team.locked_until && new Date(team.locked_until) > new Date()) {
      return fail(`Demasiados intentos fallidos. Espera ${LOCK_MINUTES} minutos o pide el código al organizador.`, 429);
    }
    if (!joinCode) return fail("Escribe el código de tu equipo.");
    if (!verifyJoinCode(joinCode, team.join_code_hash)) {
      const attempts = team.failed_join_attempts + 1;
      const lock = attempts >= MAX_FAILED_ATTEMPTS;
      await supabase
        .from("teams")
        .update({
          failed_join_attempts: lock ? 0 : attempts,
          locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : team.locked_until,
        })
        .eq("id", team.id);
      return fail("El código no es correcto. Lo tenéis en la hoja de vuestro equipo.", 403);
    }
    if (team.failed_join_attempts > 0) {
      await supabase.from("teams").update({ failed_join_attempts: 0 }).eq("id", team.id);
    }
  }

  const { count, error: countError } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id)
    .eq("active", true);
  if (countError) {
    console.error(countError);
    return fail("No se pudo comprobar el equipo. Inténtalo de nuevo.", 500);
  }
  if ((count ?? 0) >= envInt("MAX_PLAYERS_PER_TEAM", 20)) {
    return fail("Este equipo ya está completo. Habla con el organizador.", 403);
  }

  const token = randomToken();
  const { error: playerError } = await supabase.from("players").insert({
    display_name: playerName,
    team_id: team.id,
    device_token_hash: sha256(token),
  });
  if (playerError) {
    console.error(playerError);
    return fail("No se pudo completar el registro. Inténtalo de nuevo.", 500);
  }

  after(() => notifyTelegram(joinMessage(playerName, team.name)));

  const res = NextResponse.json({ ok: true, teamName: team.name, playerName });
  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return res;
}
