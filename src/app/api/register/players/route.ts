import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { checkTeamAccess } from "@/lib/team-access";

/**
 * «Ya me registré»: devuelve los nombres de los jugadores de un equipo para elegir el tuyo.
 * Solo con el código correcto del equipo (si lo tiene); los fallos cuentan para el bloqueo.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const access = await checkTeamAccess(body.teamId, body.joinCode);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data, error } = await db()
    .from("players")
    .select("id, display_name")
    .eq("team_id", access.team.id)
    .eq("active", true)
    .order("created_at");
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo cargar el equipo. Inténtalo de nuevo." }, { status: 500 });
  }
  return NextResponse.json(
    { players: (data ?? []).map((p) => ({ id: p.id, name: p.display_name })) },
    { headers: { "cache-control": "no-store" } },
  );
}
