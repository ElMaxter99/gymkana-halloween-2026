import Link from "next/link";
import { db } from "@/lib/supabase";
import { getCurrentPlayer, safeNext } from "@/lib/player";
import { ArrowLeftIcon, Bat } from "@/components/ornaments";
import RegistroForm from "./RegistroForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; modo?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const player = await getCurrentPlayer();

  // Solo se exponen id y nombre de los equipos: nunca el código ni sus jugadores.
  const { data: teams, error } = await db()
    .from("teams")
    .select("id, name")
    .eq("active", true)
    .order("name");
  if (error) throw error;

  const list = teams ?? [];
  const initialMode = params.modo === "crear" || (params.modo !== "unirme" && list.length === 0) ? "create" : "join";

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
        <Bat className="flutter" size={44} />
      </div>
      <h1 className="title center" style={{ fontSize: "2.3rem" }}>
        {initialMode === "create" && !player ? "Crea tu equipo" : "Únete a la aventura"}
      </h1>
      {next && !player && (
        <p className="alert alert--info">
          ¡Habéis encontrado un QR! Identifícate y te llevamos directamente a él.
        </p>
      )}
      <RegistroForm
        teams={list}
        next={next}
        initialMode={initialMode}
        current={player ? { playerName: player.displayName, teamName: player.teamName } : null}
      />
    </main>
  );
}
