import { db } from "@/lib/supabase";
import { getCurrentPlayer, safeNext } from "@/lib/player";
import RegistroForm from "./RegistroForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  const player = await getCurrentPlayer();

  const { data: teams, error } = await db()
    .from("teams")
    .select("id, name")
    .eq("active", true)
    .order("name");
  if (error) throw error;

  return (
    <main className="page">
      <div className="emoji-hero">🕸️</div>
      <h1 className="center">Registro de jugadores</h1>
      {next && !player && (
        <p className="center muted">¡Habéis encontrado un QR! Antes de verlo, identifícate.</p>
      )}
      <RegistroForm
        teams={teams ?? []}
        next={next}
        current={player ? { playerName: player.displayName, teamName: player.teamName } : null}
      />
    </main>
  );
}
