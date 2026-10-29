"use client";

import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    let stopped = false;
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
    const timer = setInterval(tick, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const playerCount = data.teams.reduce((n, t) => n + t.players.length, 0);
  const activePoints = data.points.filter((p) => p.active);

  return (
    <main className="page-wide">
      <div className="toolbar">
        <h1>🎃 Panel del coordinador</h1>
        <nav>
          <Link href="/admin/qr">Puntos QR</Link>
          <button className="inline secondary" onClick={logout}>Salir</button>
        </nav>
      </div>
      <p className="muted small">
        {offline ? "⚠️ Sin conexión, reintentando…" : `Actualizado ${formatTime(data.generatedAt, timeZone)}`}
        {" · "}se actualiza cada {REFRESH_MS / 1000} s
      </p>

      <div className="stats">
        <div className="stat"><b>{data.teams.length}</b>equipos</div>
        <div className="stat"><b>{playerCount}</b>jugadores</div>
        <div className="stat"><b>{activePoints.length}</b>QR activos</div>
        <div className="stat"><b>{data.totalScans}</b>escaneos</div>
      </div>

      <section className="card">
        <h2>Progreso por equipo</h2>
        <p className="muted small">Hora del primer escaneo de cada equipo en cada QR (entre paréntesis, escaneos totales).</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                {activePoints.map((p) => <th key={p.id}>{p.title}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((t) => {
                const row = data.progress[t.id] ?? {};
                const found = activePoints.filter((p) => row[p.id]).length;
                return (
                  <tr key={t.id}>
                    <td><b>{t.name}</b></td>
                    {activePoints.map((p) => {
                      const cell = row[p.id];
                      return cell ? (
                        <td key={p.id} className="cell-yes">
                          {formatTime(cell.first, timeZone)} <span className="muted">({cell.count})</span>
                        </td>
                      ) : (
                        <td key={p.id} className="cell-no">—</td>
                      );
                    })}
                    <td>{found}/{activePoints.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Últimos escaneos</h2>
        <p className="muted small">Se guardan todas las aperturas, incluidas las repetidas y las recargas.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Hora</th><th>Jugador</th><th>Equipo</th><th>QR</th></tr>
            </thead>
            <tbody>
              {data.recentScans.length === 0 && (
                <tr><td colSpan={4} className="muted">Todavía no hay escaneos.</td></tr>
              )}
              {data.recentScans.map((s) => (
                <tr key={s.id} className={fresh.has(s.id) ? "fresh" : undefined}>
                  <td>{formatDateTime(s.scannedAt, timeZone)}</td>
                  <td>{s.playerName}</td>
                  <td>{s.teamName}</td>
                  <td>{s.pointTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Equipos y jugadores</h2>
        {data.teams.length === 0 && <p className="muted">Todavía no se ha registrado ningún equipo.</p>}
        {data.teams.map((t) => (
          <details key={t.id}>
            <summary>{t.name} · {t.players.length} jugador{t.players.length === 1 ? "" : "es"}</summary>
            <ul>
              {t.players.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="muted small">— {formatDateTime(p.createdAt, timeZone)}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </main>
  );
}
