import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/supabase";
import { getCurrentPlayer } from "@/lib/player";
import { formatTime } from "@/lib/format";
import { notifyTelegram, scanMessage } from "@/lib/telegram";
import { qrGoal, SLUG_RE } from "@/lib/validation";
import { GoldenRule, SuccessSeal, TeamBanner } from "@/components/ui";
import { Bat, Divider, EnvelopeIcon, PinIcon, UsersIcon } from "@/components/ornaments";

export const dynamic = "force-dynamic";

/**
 * Página de cada QR. Cada apertura con un jugador identificado guarda un escaneo en el servidor
 * (también los repetidos: es la decisión del evento, ver README → «Escaneos repetidos»).
 */
export default async function QrPointPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();

  const supabase = db();
  const { data: point, error } = await supabase
    .from("qr_points")
    .select("id, title, instructions")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!point) notFound();

  const player = await getCurrentPlayer();
  if (!player) redirect(`/registro?next=/p/${slug}`);

  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const { data: scan, error: scanError } = await supabase
    .from("scan_events")
    .insert({
      player_id: player.id,
      team_id: player.teamId,
      qr_point_id: point.id,
      user_agent: userAgent,
    })
    .select("scanned_at")
    .single();
  if (scanError) throw scanError;

  // Escaneos del equipo, incluido el recién guardado.
  const { data: teamScans } = await supabase.from("scan_events").select("qr_point_id").eq("team_id", player.teamId);
  const teamScansOfPoint = (teamScans ?? []).filter((s) => s.qr_point_id === point.id).length || 1;
  const pointsFound = new Set((teamScans ?? []).map((s) => s.qr_point_id)).size || 1;
  const goal = qrGoal();

  after(() =>
    notifyTelegram(
      scanMessage({
        player: player.displayName,
        team: player.teamName,
        point: point.title,
        at: scan.scanned_at,
        teamScansOfPoint,
      }),
    ),
  );

  return (
    <main className="page">
      <TeamBanner playerName={player.displayName} teamName={player.teamName} />

      <article className="parchment">
        <header className="point-head">
          <PinIcon className="pin" size={40} />
          <span className="label">QR encontrado</span>
          <h1>{point.title}</h1>
        </header>
        <Divider />
        <div className="instructions">{point.instructions}</div>
        <div className="center" style={{ color: "var(--ink)", marginTop: 12 }}>
          <Bat size={46} />
        </div>
      </article>

      <section className="parchment">
        <SuccessSeal title="Escaneo registrado">
          <span className="stamp-time">
            {player.displayName} · {formatTime(scan.scanned_at)}
          </span>
        </SuccessSeal>
        <p className="small" style={{ marginBottom: 0 }}>
          {teamScansOfPoint > 1
            ? `Vuestro equipo ya había registrado este QR. Este escaneo también queda anotado (${teamScansOfPoint} en total).`
            : "Es la primera vez que vuestro equipo registra este QR."}
        </p>
        <p className="small" style={{ fontWeight: 700 }}>
          {pointsFound >= goal
            ? `¡Ya tenéis vuestras ${goal} ubicaciones!`
            : `Lleváis ${pointsFound} de ${goal} ubicaciones.`}
        </p>
        <p className="muted small">
          El escaneo indica que habéis encontrado el QR; la prueba la valida el organizador.
        </p>
      </section>

      <GoldenRule />
      <p className="center muted small" style={{ marginTop: -4 }}>
        <EnvelopeIcon size={16} /> Enviad las fotos o vídeos por WhatsApp al organizador.
      </p>

      <Link className="button btn-wood" href="/equipo">
        <UsersIcon /> Ver mi equipo
      </Link>
    </main>
  );
}
