import Link from "next/link";
import { db } from "@/lib/supabase";
import { getCurrentPlayer, safeNext } from "@/lib/player";
import { TEAM_CODE_RE } from "@/lib/validation";
import { ArrowLeftIcon, Bat } from "@/components/ornaments";
import RegistroForm, { type TeamOption } from "./RegistroForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const player = await getCurrentPlayer();

  const { data, error } = await db()
    .from("teams")
    .select("id, name, slug, join_code, join_code_hash")
    .eq("active", true)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;

  // Al navegador solo llega el id, el nombre y si el equipo pide código; nunca el hash.
  const teams: TeamOption[] = (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    requiresCode: Boolean(t.join_code_hash),
    // Al navegador solo llega si el código es numérico (para el teclado), nunca el código.
    numericCode: !t.join_code || TEAM_CODE_RE.test(t.join_code),
  }));

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
        <Bat className="flutter" size={44} />
      </div>
      <h1 className="title page-title center">
        Únete a la <span className="accent">aventura</span>
      </h1>
      {next && !player && (
        <p className="alert alert--info">¡Habéis encontrado un QR! Identifícate y te llevamos directamente a él.</p>
      )}
      <RegistroForm
        teams={teams}
        next={next}
        current={
          player ? { playerName: player.displayName, teamName: player.teamName, teamSlug: player.teamSlug } : null
        }
      />
    </main>
  );
}
