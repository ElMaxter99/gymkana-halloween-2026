import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import { restoreGame, startNewGame } from "./actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  nueva: { ok: true, text: "Partida guardada. El sistema está listo para una partida nueva: los jugadores tendrán que registrarse otra vez." },
  restaurada: { ok: true, text: "Copia restaurada. Los móviles de esa partida vuelven a estar identificados. La partida que había antes se guardó como copia automática." },
  "sin-confirmar": { ok: false, text: "Marca la casilla de confirmación para continuar." },
  error: { ok: false, text: "No se pudo completar la operación. No se ha borrado nada; revisa que el esquema de Supabase esté actualizado." },
};

export default async function GamesAdminPage({ searchParams }: { searchParams: Promise<{ hecho?: string }> }) {
  await requireAdmin();
  const message = MESSAGES[(await searchParams).hecho ?? ""];

  const supabase = db();
  const [playersRes, scansRes, archivesRes] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("scan_events").select("id", { count: "exact", head: true }),
    supabase
      .from("game_archives")
      .select("id, label, archived_at, players_count, scans_count")
      .order("archived_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);
  for (const r of [playersRes, scansRes, archivesRes]) if (r.error) throw r.error;
  const archives = archivesRes.data ?? [];

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Partidas</h1>
        <nav>
          <Link href="/admin">← Volver al panel</Link>
        </nav>
      </header>

      {message && (
        <div className={`alert ${message.ok ? "alert--ok" : "alert--error"}`} role={message.ok ? "status" : "alert"}>
          <span>{message.text}</span>
        </div>
      )}

      <section className="panel" aria-labelledby="current-title">
        <h2 id="current-title">Partida actual</h2>
        <p style={{ margin: "4px 0 0" }}>
          <b>{playersRes.count ?? 0}</b> jugadores · <b>{scansRes.count ?? 0}</b> escaneos
        </p>
        <form action={startNewGame}>
          <label htmlFor="label">Nombre de la copia (opcional)</label>
          <input id="label" name="label" maxLength={80} placeholder="Ej. Ensayo del jueves" autoComplete="off" />
          <label className="confirm">
            <input type="checkbox" name="confirm" required />
            Entiendo que se guardará una copia y que jugadores y escaneos volverán a cero. Equipos, códigos y QR se
            mantienen.
          </label>
          <button type="submit">Guardar copia y empezar partida nueva</button>
        </form>
      </section>

      <section className="panel" aria-labelledby="archives-title">
        <h2 id="archives-title">Copias guardadas</h2>
        <p className="muted small">
          Restaurar una copia la vuelve a poner en juego tal como estaba (los móviles siguen identificados). Si la partida
          actual tiene datos, antes se guarda como «copia automática», así que restaurar nunca pierde nada. Las copias no
          se pueden borrar desde la web.
        </p>
        {archives.length === 0 && <p className="muted">Todavía no hay copias.</p>}
        {archives.map((a) => (
          <details key={a.id}>
            <summary>
              {a.label}
              <span className="muted small">
                · {formatDateTime(a.archived_at)} · {a.players_count} jugadores · {a.scans_count} escaneos
              </span>
            </summary>
            <p className="small">
              Descargar: <a href={`/api/admin/archives/${a.id}?formato=csv`}>escaneos en CSV (Excel)</a> ·{" "}
              <a href={`/api/admin/archives/${a.id}?formato=json`}>todo en JSON</a>
            </p>
            <form action={restoreGame}>
              <input type="hidden" name="id" value={a.id} />
              <label className="confirm">
                <input type="checkbox" name="confirm" required />
                Restaurar «{a.label}» (la partida actual se guardará antes como copia).
              </label>
              <button type="submit" className="btn-wood">
                Restaurar esta partida
              </button>
            </form>
          </details>
        ))}
      </section>
    </main>
  );
}
