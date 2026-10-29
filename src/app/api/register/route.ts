import { NextResponse, after } from "next/server";
import { db } from "@/lib/supabase";
import { hashJoinCode, randomToken, sha256, verifyJoinCode } from "@/lib/crypto";
import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE } from "@/lib/player";
import { joinMessage, notifyTelegram } from "@/lib/telegram";

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 5;

type Body = {
  mode?: unknown;
  playerName?: unknown;
  teamName?: unknown;
  teamId?: unknown;
  joinCode?: unknown;
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail("Petición no válida");
  }

  const playerName = str(body.playerName, 40);
  const joinCode = typeof body.joinCode === "string" ? body.joinCode.trim().slice(0, 40) : "";
  if (!playerName) return fail("Escribe tu nombre");
  if (joinCode.length < 4) return fail("El código debe tener al menos 4 caracteres");

  const supabase = db();
  let teamId: string;
  let teamName: string;
  let created = false;

  if (body.mode === "create") {
    teamName = str(body.teamName, 40);
    if (teamName.length < 2) return fail("El nombre del equipo es demasiado corto");

    const { data, error } = await supabase
      .from("teams")
      .insert({ name: teamName, join_code_hash: hashJoinCode(joinCode) })
      .select("id, name")
      .single();
    if (error) {
      if (error.code === "23505") return fail("Ya existe un equipo con ese nombre. Elige otro o únete a él.", 409);
      console.error(error);
      return fail("No se pudo crear el equipo", 500);
    }
    teamId = data.id;
    teamName = data.name;
    created = true;
  } else if (body.mode === "join") {
    const id = str(body.teamId, 64);
    const { data: team, error } = await supabase
      .from("teams")
      .select("id, name, join_code_hash, failed_join_attempts, locked_until, active")
      .eq("id", id)
      .maybeSingle();
    if (error && error.code !== "22P02") {
      console.error(error);
      return fail("No se pudo comprobar el equipo", 500);
    }
    if (!team || !team.active) return fail("Ese equipo no existe", 404);

    if (team.locked_until && new Date(team.locked_until) > new Date()) {
      return fail("Demasiados intentos fallidos. Espera unos minutos.", 429);
    }

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
      return fail("Código incorrecto", 403);
    }

    if (team.failed_join_attempts > 0) {
      await supabase.from("teams").update({ failed_join_attempts: 0 }).eq("id", team.id);
    }
    teamId = team.id;
    teamName = team.name;
  } else {
    return fail("Petición no válida");
  }

  const token = randomToken();
  const { error: playerError } = await supabase.from("players").insert({
    display_name: playerName,
    team_id: teamId,
    device_token_hash: sha256(token),
  });
  if (playerError) {
    console.error(playerError);
    if (created) await supabase.from("teams").delete().eq("id", teamId);
    return fail("No se pudo registrar al jugador", 500);
  }

  after(() => notifyTelegram(joinMessage(playerName, teamName, created)));

  const res = NextResponse.json({ ok: true, teamName, playerName });
  res.cookies.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
  return res;
}
