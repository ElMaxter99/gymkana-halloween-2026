import { NextResponse, after } from "next/server";
import { db } from "@/lib/supabase";
import { randomToken, sha256 } from "@/lib/crypto";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE, getCurrentPlayer } from "@/lib/player";
import { joinMessage, notifyTelegram, rejoinMessage } from "@/lib/telegram";
import { checkTeamAccess } from "@/lib/team-access";
import { cleanName, envInt, isUuid } from "@/lib/validation";

type Body = {
  mode?: unknown;
  playerName?: unknown;
  playerId?: unknown;
  teamId?: unknown;
  joinCode?: unknown;
};

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Identifica este móvil con un token nuevo (en la base de datos solo se guarda su hash). */
function withDeviceCookie(res: NextResponse, token: string) {
  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return res;
}

/**
 * Une este móvil a uno de los equipos fijos de la gymkana:
 * - mode «new» (por defecto): jugador nuevo con su nombre.
 * - mode «existing»: «Ya me registré» — entra como un jugador que ya existe (p. ej. se le
 *   murió el móvil). El móvil anterior deja de estar identificado: un jugador, un móvil.
 * Si el equipo tiene código, hay que escribirlo en los dos casos.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Petición no válida");
  }
  const existingMode = body.mode === "existing";

  const playerName = cleanName(body.playerName, 40);
  if (!existingMode && !playerName) return fail("Escribe tu nombre.");
  if (existingMode && !isUuid(body.playerId)) return fail("Elige tu nombre de la lista.");
  if (!isUuid(body.teamId)) return fail("Elige tu equipo.");

  // Evita registros duplicados por doble pulsación o por volver atrás:
  // para registrarse de nuevo hay que pulsar antes «No soy yo».
  const current = await getCurrentPlayer();
  if (current) {
    return fail(`Este móvil ya está registrado como ${current.displayName} (${current.teamName}).`, 409);
  }

  const access = await checkTeamAccess(body.teamId, body.joinCode);
  if (!access.ok) return fail(access.error, access.status);
  const { team } = access;
  const supabase = db();
  const token = randomToken();

  if (existingMode) {
    const { data: player, error } = await supabase
      .from("players")
      .update({ device_token_hash: sha256(token) })
      .eq("id", body.playerId)
      .eq("team_id", team.id)
      .eq("active", true)
      .select("display_name")
      .maybeSingle();
    if (error) {
      console.error(error);
      return fail("No se pudo completar la entrada. Inténtalo de nuevo.", 500);
    }
    if (!player) return fail("Ese jugador ya no está en el equipo. Regístrate como nuevo.", 404);
    after(() => notifyTelegram(rejoinMessage(player.display_name, team.name)));
    return withDeviceCookie(
      NextResponse.json({ ok: true, teamName: team.name, playerName: player.display_name, returning: true }),
      token,
    );
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
  return withDeviceCookie(NextResponse.json({ ok: true, teamName: team.name, playerName }), token);
}
