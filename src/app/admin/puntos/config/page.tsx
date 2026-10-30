import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { TeamEmblem } from "@/components/ornaments";
import { addTask, renameTeam, resetScores, updateActivity, updateBonus, updateTask } from "./actions";

export const dynamic = "force-dynamic";

const KIND_TEXT = { all: "todas las pruebas del equipo", min: "al menos N pruebas", manual: "lo asignas tú a un equipo" };

export default async function ScoreConfigPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const s = db();
  const [teams, activities, tasks, bonuses] = await Promise.all([
    s.from("teams").select("id, name, slug").order("sort_order").order("created_at"),
    s.from("score_activities").select("id, name, short_name").order("sort_order"),
    s.from("score_tasks").select("id, activity_id, label, points, group_label, active, counts_for_bonus, qr_point_id").order("sort_order"),
    s.from("score_bonuses").select("id, activity_id, label, kind, threshold, points, active").order("sort_order"),
  ]);
  for (const r of [teams, activities, tasks, bonuses]) if (r.error) throw r.error;

  return (
    <main className="page-wide admin config">
      <header className="admin-header">
        <h1>Configuración del marcador</h1>
        <nav>
          <Link href="/admin/puntos">← Puntuar</Link>
        </nav>
      </header>

      {params.ok && (
        <div className="alert alert--ok" role="status">
          <span>✓ {params.ok}. El marcador se ha recalculado.</span>
        </div>
      )}
      {params.error && (
        <div className="alert alert--error" role="alert">
          <span>
            <b>Error:</b> {params.error}
          </span>
        </div>
      )}

      <section className="panel" id="equipos">
        <h2>Equipos</h2>
        <p className="muted small">El emblema, la ruta y el mapa van ligados al equipo, no a su nombre: puedes renombrarlos libremente.</p>
        {(teams.data ?? []).map((t) => (
          <form key={t.id} action={renameTeam} className="config-row">
            <input type="hidden" name="id" value={t.id} />
            <TeamEmblem name={t.name} slug={t.slug} size={30} />
            <label className="sr-only" htmlFor={`team-${t.id}`}>
              Nombre de {t.name}
            </label>
            <input id={`team-${t.id}`} name="name" defaultValue={t.name} maxLength={40} required />
            <button type="submit" className="inline">
              Guardar
            </button>
          </form>
        ))}
      </section>

      {(activities.data ?? []).map((a) => (
        <section key={a.id} className="panel" id={`act-${a.id}`}>
          <form action={updateActivity} className="config-row config-row--activity">
            <input type="hidden" name="id" value={a.id} />
            <label>
              Actividad
              <input name="name" defaultValue={a.name} maxLength={80} required />
            </label>
            <label>
              Nombre corto (TV)
              <input name="short_name" defaultValue={a.short_name ?? ""} maxLength={20} />
            </label>
            <button type="submit" className="inline">
              Guardar
            </button>
          </form>

          <h3 className="config-subtitle">Pruebas</h3>
          {(tasks.data ?? [])
            .filter((t) => t.activity_id === a.id)
            .map((t) => (
              <form key={t.id} action={updateTask} className={`config-task ${t.active ? "" : "is-inactive"}`}>
                <input type="hidden" name="id" value={t.id} />
                <label className="config-task__label">
                  <span className="sr-only">Prueba</span>
                  <input name="label" defaultValue={t.label} maxLength={160} required />
                </label>
                <label className="config-task__pts">
                  Puntos
                  <input name="points" type="number" inputMode="numeric" defaultValue={t.points} min={-100} max={100} required />
                </label>
                <label className="config-task__group">
                  Grupo
                  <input name="group_label" defaultValue={t.group_label ?? ""} maxLength={40} placeholder="—" />
                </label>
                <label className="confirm">
                  <input type="checkbox" name="active" defaultChecked={t.active} /> Activa
                </label>
                <label className="confirm">
                  <input type="checkbox" name="counts_for_bonus" defaultChecked={t.counts_for_bonus} /> Cuenta para bonus
                </label>
                {t.qr_point_id && <span className="tag tag--first">QR: solo su ruta</span>}
                <button type="submit" className="inline">
                  Guardar
                </button>
              </form>
            ))}
          <details className="config-add">
            <summary>＋ Añadir prueba</summary>
            <form action={addTask} className="config-task">
              <input type="hidden" name="activity_id" value={a.id} />
              <label className="config-task__label">
                Nombre
                <input name="label" maxLength={160} required />
              </label>
              <label className="config-task__pts">
                Puntos
                <input name="points" type="number" inputMode="numeric" defaultValue={0} min={-100} max={100} required />
              </label>
              <label className="config-task__group">
                Grupo
                <input name="group_label" maxLength={40} placeholder="—" />
              </label>
              <button type="submit" className="inline">
                Añadir
              </button>
            </form>
          </details>

          {(bonuses.data ?? []).some((b) => b.activity_id === a.id) && <h3 className="config-subtitle">Bonus</h3>}
          {(bonuses.data ?? [])
            .filter((b) => b.activity_id === a.id)
            .map((b) => (
              <form key={b.id} action={updateBonus} className={`config-task ${b.active ? "" : "is-inactive"}`}>
                <input type="hidden" name="id" value={b.id} />
                <label className="config-task__label">
                  <span className="sr-only">Bonus</span>
                  <input name="label" defaultValue={b.label} maxLength={120} required />
                  <span className="muted small">{KIND_TEXT[b.kind as keyof typeof KIND_TEXT]}</span>
                </label>
                <label className="config-task__pts">
                  Puntos
                  <input name="points" type="number" inputMode="numeric" defaultValue={b.points} min={-100} max={100} required />
                </label>
                {b.kind === "min" ? (
                  <label className="config-task__group">
                    Mínimo
                    <input name="threshold" type="number" inputMode="numeric" defaultValue={b.threshold ?? 1} min={1} required />
                  </label>
                ) : (
                  <input type="hidden" name="threshold" value="" />
                )}
                <label className="confirm">
                  <input type="checkbox" name="active" defaultChecked={b.active} /> Activo
                </label>
                <button type="submit" className="inline">
                  Guardar
                </button>
              </form>
            ))}
        </section>
      ))}

      <section className="panel panel--danger" id="peligro">
        <h2>Zona peligrosa</h2>
        <p className="small">
          <b>Reiniciar el marcador</b> pone a 0 a todos los equipos: borra los resultados de las pruebas, los bonus asignados
          y los extras. Se conservan la configuración y el historial. Si lo que quieres es empezar una partida guardando la
          actual, usa <Link href="/admin/partidas">Partidas</Link> (se puede restaurar).
        </p>
        <form action={resetScores} className="config-row">
          <label htmlFor="confirm-reset">Escribe REINICIAR para confirmar</label>
          <input id="confirm-reset" name="confirm" autoComplete="off" required placeholder="REINICIAR" />
          <button type="submit" className="btn-seal">
            Reiniciar marcador
          </button>
        </form>
      </section>
    </main>
  );
}
