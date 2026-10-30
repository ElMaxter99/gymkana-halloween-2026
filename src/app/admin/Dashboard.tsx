"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Overview } from "@/lib/overview";
import { formatDateTime, formatTime } from "@/lib/format";

const REFRESH_MS = 5000;

export default function Dashboard({ initial, timeZone }: { initial: Overview; timeZone: string }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [offline, setOffline] = useState(false);
  const seen = useRef(new Set(initial.recentScans.map((s) => s.id)));
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const [teamFilter, setTeamFilter] = useState("");
  const [playerFilter, setPlayerFilter] = useState("");
  const [pointFilter, setPointFilter] = useState("");

  // Sondeo cada 5 s mientras la pestaña está visible; al volver a ella se actualiza al instante.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function tick() {
      try {
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const next: Overview = await res.json();
        if (stopped) return;
        const newIds = next.recentScans.map((s) => s.id).filter((id) => !seen.current.has(id));
        newIds.forEach((id) => seen.current.add(id));
        setFresh(new Set(newIds));
        setData(next);
        setOffline(false);
      } catch {
        if (!stopped) setOffline(true);
      }
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(tick, REFRESH_MS);
    }
    function onVisibility() {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        tick();
        start();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const activePlayers = data.teams.reduce((n, t) => n + t.players.filter((p) => p.active).length, 0);
  const activePoints = data.points.filter((p) => p.active);

  const playerOptions = useMemo(
    () =>
      data.teams
        .filter((t) => !teamFilter || t.id === teamFilter)
        .flatMap((t) => t.players.map((p) => ({ ...p, teamName: t.name }))),
    [data.teams, teamFilter],
  );

  const filtered = data.recentScans.filter(
    (s) =>
      (!teamFilter || s.teamId === teamFilter) &&
      (!playerFilter || s.playerId === playerFilter) &&
      (!pointFilter || s.pointId === pointFilter),
  );
  const filtering = Boolean(teamFilter || playerFilter || pointFilter);

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Panel del coordinador</h1>
        <nav>
          <Link href="/admin/equipos">Equipos y códigos</Link>
          <Link href="/admin/sobres">Sobres</Link>
          <Link href="/admin/partidas">Partidas</Link>
          <Link href="/admin/qr">Puntos QR</Link>
          <button type="button" className="inline btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </nav>
      </header>

      <div className={`live ${offline ? "live--off" : ""}`} role="status" aria-live="polite">
        <span className="live__dot" aria-hidden="true" />
        {offline
          ? "Sin conexión con el servidor. Reintentando…"
          : `En directo · actualizado a las ${formatTime(data.generatedAt, timeZone)}`}
        <span className="muted small">(cada {REFRESH_MS / 1000} s)</span>
      </div>

      <div className="stats">
        <div className="stat"><b>{data.teams.length}</b>equipos</div>
        <div className="stat"><b>{activePlayers}</b>jugadores</div>
        <div className="stat"><b>{data.totalScans}</b>escaneos</div>
        <div className="stat"><b>{activePoints.length}</b>QR activos</div>
      </div>

      <section className="panel" aria-labelledby="activity-title">
        <h2 id="activity-title">Actividad reciente</h2>
        <p className="muted small">
          Se guardan todas las aperturas de un QR, también las repetidas y las recargas. «1.º» marca el primer escaneo de
          ese equipo en ese punto.
        </p>

        <div className="filters">
          <div>
            <label htmlFor="f-team">Equipo</label>
            <select
              id="f-team"
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPlayerFilter("");
              }}
            >
              <option value="">Todos</option>
              {data.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-player">Jugador</label>
            <select id="f-player" value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
              <option value="">Todos</option>
              {playerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{teamFilter ? "" : ` (${p.teamName})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-point">Punto QR</label>
            <select id="f-point" value={pointFilter} onChange={(e) => setPointFilter(e.target.value)}>
              <option value="">Todos</option>
              {data.points.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          {filtering && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setTeamFilter("");
                setPlayerFilter("");
                setPointFilter("");
              }}
            >
              Quitar filtros
            </button>
          )}
        </div>

        <p className="muted small">
          {filtering
            ? `${filtered.length} escaneos coinciden con el filtro`
            : `${filtered.length} escaneos`}
          {data.totalScans > data.recentLimit && ` (se muestran los ${data.recentLimit} más recientes)`}
        </p>

        <div className="table-wrap">
          <table className="stack-table">
            <thead>
              <tr><th>Fecha y hora</th><th>Jugador</th><th>Equipo</th><th>Punto QR</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    {filtering ? "Ningún escaneo coincide con el filtro." : "Todavía no hay escaneos."}
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className={fresh.has(s.id) ? "fresh" : undefined}>
                  <td className="time" data-label="Hora">{formatDateTime(s.scannedAt, timeZone)}</td>
                  <td data-label="Jugador">{s.playerName}</td>
                  <td className="team" data-label="Equipo">{s.teamName}</td>
                  <td data-label="Punto QR">
                    {s.pointTitle}
                    {s.first && <span className="tag tag--first">1.º</span>}
                    {s.offRoute && <span className="tag tag--offroute">fuera de ruta</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="progress-title">
        <h2 id="progress-title">Progreso por equipo</h2>
        <p className="muted small">
          Hora del primer escaneo de cada equipo en cada QR activo (entre paréntesis, escaneos totales). Cada equipo
          tiene que encontrar {data.qrGoal}. Si has marcado las rutas en «Puntos QR»: «pendiente» = le toca y aún no
          lo ha escaneado; «no le toca» = fuera de su ruta.
        </p>
        {data.teams.length === 0 ? (
          <p className="muted">Todavía no se ha registrado ningún equipo.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  {activePoints.map((p) => <th key={p.id}>{p.title}</th>)}
                  <th>Ubicaciones (objetivo {data.qrGoal})</th>
                </tr>
              </thead>
              <tbody>
                {data.teams.map((t) => {
                  const row = data.progress[t.id] ?? {};
                  // Los QR fuera de ruta no cuentan para el objetivo.
                  const found = activePoints.filter(
                    (p) => row[p.id] && (!p.assignedTeamIds || p.assignedTeamIds.includes(t.id)),
                  ).length;
                  return (
                    <tr key={t.id}>
                      <td className="team">{t.name}</td>
                      {activePoints.map((p) => {
                        const cell = row[p.id];
                        const assigned = p.assignedTeamIds;
                        const onRoute = !assigned || assigned.includes(t.id);
                        if (cell) {
                          return (
                            <td key={p.id} className={onRoute ? "cell-yes" : "cell-offroute"}>
                              ✓ {formatTime(cell.first, timeZone)} <span className="muted">({cell.count})</span>
                              {!onRoute && <span className="tag tag--offroute">fuera de ruta</span>}
                            </td>
                          );
                        }
                        if (!assigned) return <td key={p.id} className="cell-no" aria-label="Sin escanear">—</td>;
                        return onRoute ? (
                          <td key={p.id} className="cell-pending">pendiente</td>
                        ) : (
                          <td key={p.id} className="cell-na">no le toca</td>
                        );
                      })}
                      <td className={found >= data.qrGoal ? "cell-yes" : undefined}>
                        {found >= data.qrGoal ? "✓ " : ""}
                        {found}/{data.qrGoal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="teams-title">
        <h2 id="teams-title">Equipos y jugadores</h2>
        {data.teams.length === 0 && <p className="muted">Todavía no se ha registrado ningún equipo.</p>}
        {data.teams.map((t) => {
          const active = t.players.filter((p) => p.active).length;
          return (
            <details key={t.id}>
              <summary>
                {t.name}
                <span className="muted small">
                  · {active} jugador{active === 1 ? "" : "es"} · creado {formatTime(t.createdAt, timeZone)}
                </span>
              </summary>
              <ul>
                {t.players.map((p) => (
                  <li key={p.id}>
                    {p.name}{" "}
                    <span className="muted small">— {formatDateTime(p.createdAt, timeZone)}</span>
                    {!p.active && <span className="tag tag--off">dado de baja</span>}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>
    </main>
  );
}
