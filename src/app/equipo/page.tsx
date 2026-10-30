import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
import { getCurrentPlayer } from "@/lib/player";
import { formatTime } from "@/lib/format";
import { qrGoal } from "@/lib/validation";
import { countPointsOnRoute } from "@/lib/overview";
import { TeamBanner } from "@/components/ui";
import { ArrowLeftIcon, Divider, EnvelopeIcon, SkullCrossbones, TrophyIcon } from "@/components/ornaments";

export const dynamic = "force-dynamic";

type ScanRow = {
  id: number;
  scanned_at: string;
  qr_point_id: string;
  player: { display_name: string } | null;
  point: { title: string } | null;
};

export default async function TeamPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/registro");

  const supabase = db();
  const [playersRes, scansRes, recentRes] = await Promise.all([
    supabase
      .from("players")
      .select("id, display_name")
      .eq("team_id", player.teamId)
      .eq("active", true)
      .order("created_at"),
    supabase.from("scan_events").select("qr_point_id", { count: "exact" }).eq("team_id", player.teamId),
    supabase
      .from("scan_events")
      .select("id, scanned_at, qr_point_id, player:players(display_name), point:qr_points(title)")
      .eq("team_id", player.teamId)
      .order("scanned_at", { ascending: false })
      .limit(15),
  ]);
  for (const r of [playersRes, scansRes, recentRes]) if (r.error) throw r.error;

  const players = playersRes.data ?? [];
  const totalScans = scansRes.count ?? 0;
  const pointsFound = await countPointsOnRoute(scansRes.data ?? [], player.teamId);
  const recent = (recentRes.data ?? []) as unknown as ScanRow[];
  const goal = qrGoal();

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
      </div>

      <TeamBanner playerName={player.displayName} teamName={player.teamName} teamSlug={player.teamSlug} />

      <section className="parchment" aria-labelledby="stats-title">
        <h2 id="stats-title">Vuestro grimorio</h2>
        <Divider />
        <div className="stat-row">
          <div className="stat-tile">
            <b>
              {pointsFound}
              <small> / {goal}</small>
            </b>
            <span className="label">ubicaciones</span>
          </div>
          <div className="stat-tile">
            <b>{totalScans}</b>
            <span className="label">escaneos</span>
          </div>
        </div>
        <p className="small" style={{ fontWeight: 700 }}>
          {pointsFound >= goal
            ? `¡Habéis encontrado vuestras ${goal} ubicaciones!`
            : `Os ${goal - pointsFound === 1 ? "queda" : "quedan"} ${goal - pointsFound} de ${goal} ubicaciones por encontrar.`}
        </p>
        <p className="muted small">
          Escanear un QR solo indica que lo habéis encontrado. Las pruebas las valida el organizador con las fotos y
          vídeos que le enviéis por WhatsApp.
        </p>
      </section>

      <section className="parchment" aria-labelledby="players-title">
        <h2 id="players-title">Jugadores</h2>
        <Divider />
        <ul className="list">
          {players.map((p) => (
            <li key={p.id}>
              <span>
                {p.display_name}
                {p.id === player.id && <b> (tú)</b>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="parchment" aria-labelledby="activity-title">
        <h2 id="activity-title">Actividad reciente</h2>
        <Divider />
        {recent.length === 0 ? (
          <p className="empty">Todavía no habéis escaneado ningún QR. ¡Seguid buscando!</p>
        ) : (
          <ul className="list">
            {recent.map((s) => (
              <li key={s.id}>
                <span>
                  <b>{s.point?.title ?? "Punto"}</b>
                  <br />
                  <span className="muted small">{s.player?.display_name ?? "?"}</span>
                </span>
                <span className="when">{formatTime(s.scanned_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link className="button btn-seal" href="/sobres">
        <EnvelopeIcon /> Vuestros sobres
      </Link>
      <Link className="button btn-wood" href="/marcador">
        <TrophyIcon /> Marcador en vivo
      </Link>
      <Link className="button btn-wood" href="/reglas">
        <SkullCrossbones size={26} /> Reglas de la gincana
      </Link>
    </main>
  );
}
