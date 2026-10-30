"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BonusStatus, TaskStatus } from "@/lib/scoring";
import { useScoreChannel } from "@/lib/useScoreChannel";
import { TeamEmblem } from "@/components/ornaments";
import { addExtra, setAward, setTaskNote, setTaskStatus, undoAction, undoLast, type ActionResult } from "./actions";

export type PanelTask = {
  id: string;
  label: string;
  points: number;
  group: string | null;
  isQr: boolean;
  status: TaskStatus | null;
  note: string | null;
};

export type PanelActivity = {
  id: string;
  name: string;
  points: number;
  bonuses: (BonusStatus & { awardedTeamId: string | null })[];
  tasks: PanelTask[];
};

type TeamSummary = { id: string; name: string; slug: string | null; total: number; rank: number };

type Toast = { text: string; undoId?: number; error?: boolean };

export default function PuntosPanel({
  version,
  team,
  teams,
  activities,
  extras,
}: {
  version: number;
  team: TeamSummary & { extras: number };
  teams: TeamSummary[];
  activities: PanelActivity[];
  extras: { id: number; points: number; reason: string | null; at: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<Toast | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [extraReason, setExtraReason] = useState("");
  const [customExtra, setCustomExtra] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Otro organizador o un QR escaneado cambian el marcador: refrescar el panel.
  const channel = useScoreChannel((v) => {
    if (v > version) router.refresh();
  });

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function show(t: Toast) {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), t.undoId ? 9000 : 4000);
  }

  function run(action: () => Promise<ActionResult>, undoable = true) {
    startTransition(async () => {
      const res = await action();
      if (res.ok) show({ text: res.message, undoId: undoable ? res.logId : undefined });
      else show({ text: res.error, error: true });
    });
  }

  function undo(logId: number) {
    run(() => undoAction(logId), false);
  }

  const groupsOf = (tasks: PanelTask[]) => {
    const groups: { name: string | null; tasks: PanelTask[] }[] = [];
    for (const t of tasks) {
      const last = groups[groups.length - 1];
      if (last && last.name === t.group) last.tasks.push(t);
      else groups.push({ name: t.group, tasks: [t] });
    }
    return groups;
  };

  return (
    <main className="admin puntos" aria-busy={pending}>
      <div className="puntos__sticky">
        <nav className="puntos__teams" aria-label="Equipo">
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/admin/puntos?equipo=${t.id}`}
              scroll={false}
              aria-current={t.id === team.id ? "page" : undefined}
              className="puntos__team"
            >
              <TeamEmblem name={t.name} slug={t.slug} size={28} />
              <span>{t.name}</span>
              <b>{t.total}</b>
            </Link>
          ))}
        </nav>
        <div className="puntos__score" role="status" aria-live="polite">
          <span>
            <b>{team.name}</b> · {team.rank}.º puesto
          </span>
          <b className="puntos__total">{team.total} pts</b>
          <span className={`puntos__live puntos__live--${channel}`} title="Actualización en directo" />
        </div>
      </div>

      {activities.map((a) => (
        <details key={a.id} className="panel puntos__activity" open>
          <summary>
            <span className="puntos__activity-name">{a.name}</span>
            <b className="puntos__activity-pts">{a.points} pts</b>
          </summary>

          {a.bonuses.length > 0 && (
            <ul className="puntos__bonuses">
              {a.bonuses.map((b) =>
                b.kind === "manual" ? (
                  <li key={b.bonusId} className="puntos__bonus">
                    <label htmlFor={`award-${b.bonusId}`}>
                      {b.label} <span className="muted">(+{b.points}, un solo equipo)</span>
                    </label>
                    <select
                      id={`award-${b.bonusId}`}
                      value={b.awardedTeamId ?? ""}
                      disabled={pending}
                      onChange={(e) => run(() => setAward(b.bonusId, e.target.value || null))}
                    >
                      <option value="">Ningún equipo</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </li>
                ) : (
                  <li key={b.bonusId} className={`puntos__bonus ${b.achieved ? "is-achieved" : ""}`}>
                    <span>
                      {b.achieved ? "✓" : "○"} {b.label}
                    </span>
                    <b>
                      +{b.points} · {b.progress}
                    </b>
                  </li>
                ),
              )}
            </ul>
          )}

          {groupsOf(a.tasks).map((g, gi) => (
            <div key={gi}>
              {g.name && <h3 className="puntos__group">{g.name}</h3>}
              <ul className="puntos__tasks">
                {g.tasks.map((t) => (
                  <li key={t.id} className={`puntos__task puntos__task--${t.status ?? "none"}`}>
                    <div className="puntos__task-head">
                      <span className="puntos__task-label">
                        {t.label}
                        {t.status === "pending" && <span className="tag tag--offroute">QR escaneado · pendiente</span>}
                      </span>
                      <span className="puntos__task-pts">{t.points} pts</span>
                    </div>
                    <div className="puntos__task-actions">
                      <button
                        type="button"
                        className="puntos__btn puntos__btn--valid"
                        aria-pressed={t.status === "valid"}
                        disabled={pending}
                        onClick={() => run(() => setTaskStatus(team.id, t.id, t.status === "valid" ? null : "valid"))}
                      >
                        ✓ Válida
                      </button>
                      <button
                        type="button"
                        className="puntos__btn puntos__btn--invalid"
                        aria-pressed={t.status === "invalid"}
                        disabled={pending}
                        onClick={() => run(() => setTaskStatus(team.id, t.id, t.status === "invalid" ? null : "invalid"))}
                      >
                        ✗ No válida
                      </button>
                      <button
                        type="button"
                        className="puntos__btn puntos__btn--note"
                        aria-expanded={openNote === t.id}
                        aria-label={`Nota de ${t.label}`}
                        onClick={() => setOpenNote(openNote === t.id ? null : t.id)}
                      >
                        {t.note ? "📝" : "＋📝"}
                      </button>
                    </div>
                    {t.note && openNote !== t.id && <p className="puntos__note">{t.note}</p>}
                    {openNote === t.id && (
                      <form
                        className="puntos__note-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const note = String(new FormData(e.currentTarget).get("note") ?? "");
                          run(() => setTaskNote(team.id, t.id, note), false);
                          setOpenNote(null);
                        }}
                      >
                        <textarea name="note" defaultValue={t.note ?? ""} maxLength={300} placeholder="Nota (solo la ves tú)" />
                        <button type="submit" className="inline" disabled={pending}>
                          Guardar nota
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {a.tasks.length === 0 && <p className="muted small">Ninguna prueba de esta actividad le toca a este equipo.</p>}
        </details>
      ))}

      <section className="panel puntos__extras" aria-labelledby="extras-title">
        <h2 id="extras-title">Puntos extra por creatividad</h2>
        <p className="small" style={{ margin: "0 0 8px" }}>
          Total extra de {team.name}: <b>{team.extras > 0 ? `+${team.extras}` : team.extras}</b>
        </p>
        <label htmlFor="extra-reason">Motivo (opcional, no se publica)</label>
        <input id="extra-reason" value={extraReason} onChange={(e) => setExtraReason(e.target.value)} maxLength={120} />
        <div className="puntos__extra-buttons">
          {[-2, -1, 1, 2, 5].map((p) => (
            <button
              key={p}
              type="button"
              className={p < 0 ? "btn-wood" : undefined}
              disabled={pending}
              onClick={() => {
                run(() => addExtra(team.id, p, extraReason));
                setExtraReason("");
              }}
            >
              {p > 0 ? `+${p}` : p}
            </button>
          ))}
        </div>
        <form
          className="puntos__extra-custom"
          onSubmit={(e) => {
            e.preventDefault();
            const p = Number(customExtra);
            run(() => addExtra(team.id, p, extraReason));
            setCustomExtra("");
            setExtraReason("");
          }}
        >
          <label htmlFor="extra-custom" className="sr-only">
            Otra cantidad
          </label>
          <input
            id="extra-custom"
            type="number"
            inputMode="numeric"
            step={1}
            min={-100}
            max={100}
            placeholder="Otra cantidad (p. ej. -3 o 4)"
            value={customExtra}
            onChange={(e) => setCustomExtra(e.target.value)}
          />
          <button type="submit" className="inline" disabled={pending || !customExtra}>
            Añadir
          </button>
        </form>
        {extras.length > 0 && (
          <ul className="puntos__extra-list">
            {extras.map((e) => (
              <li key={e.id}>
                <b>{e.points > 0 ? `+${e.points}` : e.points}</b> {e.reason ?? <span className="muted">sin motivo</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel puntos__footer">
        <button type="button" className="btn-wood" disabled={pending} onClick={() => run(() => undoLast(), false)}>
          ↶ Deshacer la última acción
        </button>
        <nav className="puntos__links">
          <Link href="/admin/puntos/historial">Historial</Link>
          <Link href="/admin/puntos/config">Configuración</Link>
          <Link href="/marcador" target="_blank">
            Marcador
          </Link>
          <Link href="/tv" target="_blank">
            Modo TV
          </Link>
          <Link href="/admin">Panel</Link>
        </nav>
      </section>

      {toast && (
        <div className={`puntos__toast ${toast.error ? "is-error" : ""}`} role={toast.error ? "alert" : "status"}>
          <span>{toast.text}</span>
          {toast.undoId && (
            <button type="button" className="inline" onClick={() => undo(toast.undoId!)}>
              Deshacer
            </button>
          )}
        </div>
      )}
    </main>
  );
}
