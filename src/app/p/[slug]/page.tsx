import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/supabase";
import { getCurrentPlayer } from "@/lib/player";
import { notifyTelegram, scanMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export default async function QrPointPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) notFound();

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

  // Cada apertura de la página cuenta como un escaneo (también los repetidos).
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

  after(() => notifyTelegram(scanMessage(player.displayName, player.teamName, point.title, scan.scanned_at)));

  return (
    <main className="page">
      <div className="team-banner">
        <b>{player.displayName}</b>, sois el equipo
        <strong>{player.teamName}</strong>
      </div>

      <div className="emoji-hero">👻</div>
      <h1 className="center">{point.title}</h1>

      <div className="card">
        <div className="instructions">{point.instructions}</div>
      </div>

      <p className="center ok small">✔ QR registrado. El coordinador ya sabe que lo habéis encontrado.</p>
      <p className="center muted small">Enviad las fotos o vídeos de la prueba por WhatsApp.</p>
    </main>
  );
}
