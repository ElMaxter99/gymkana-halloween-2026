"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicScoreboard } from "@/lib/scoreboard";
import { useLiveScoreboard, type LiveStatus } from "@/lib/useLiveScoreboard";
import { TeamEmblem, WaxSeal } from "./ornaments";

const STATUS_TEXT: Record<LiveStatus, string> = {
  live: "En directo",
  polling: "Actualización automática",
  reconnecting: "Reconectando…",
  offline: "Sin conexión · reintentando",
};

function StatusPill({ status }: { status: LiveStatus }) {
  return (
    <span className={`live-pill live-pill--${status}`} role="status" aria-live="polite">
      <span className="live-pill__dot" aria-hidden="true" />
      {STATUS_TEXT[status]}
    </span>
  );
}

function timeOf(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" }).format(
    new Date(iso),
  );
}

function signed(points: number | null) {
  if (points === null || points === 0) return null;
  return points > 0 ? `+${points}` : String(points);
}

/**
 * Anima los cambios de puesto (técnica FLIP): mide dónde estaba cada fila antes del cambio
 * y la desliza desde allí. Además marca unos segundos la flecha de subida o bajada.
 */
function useRankAnimation(teams: PublicScoreboard["teams"]) {
  const rows = useRef(new Map<string, HTMLElement>());
  const lastTop = useRef(new Map<string, number>());
  const lastRank = useRef(new Map<string, number>(teams.map((t) => [t.id, t.rank])));
  const lastTotal = useRef(new Map<string, number>(teams.map((t) => [t.id, t.total])));
  const [moves, setMoves] = useState<Record<string, "up" | "down" | "score">>({});

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const changed: Record<string, "up" | "down" | "score"> = {};
    for (const t of teams) {
      const el = rows.current.get(t.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      const before = lastTop.current.get(t.id);
      if (before !== undefined && before !== top && !reduce) {
        el.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
          duration: 900,
          easing: "cubic-bezier(.2,.8,.2,1)",
        });
      }
      lastTop.current.set(t.id, top);
      const prevRank = lastRank.current.get(t.id);
      if (prevRank !== undefined && prevRank !== t.rank) changed[t.id] = t.rank < prevRank ? "up" : "down";
      else if ((lastTotal.current.get(t.id) ?? t.total) !== t.total) changed[t.id] = "score";
      lastRank.current.set(t.id, t.rank);
      lastTotal.current.set(t.id, t.total);
    }
    if (Object.keys(changed).length) setMoves(changed);
  }, [teams]);

  useEffect(() => {
    if (!Object.keys(moves).length) return;
    const timer = setTimeout(() => setMoves({}), 6000);
    return () => clearTimeout(timer);
  }, [moves]);

  const ref = (id: string) => (el: HTMLElement | null) => {
    if (el) rows.current.set(id, el);
    else rows.current.delete(id);
  };
  return { ref, moves };
}

/** Mantiene la pantalla encendida (Wake Lock API) mientras la página está visible. */
function useWakeLock(enabled: boolean): "on" | "unsupported" | "off" {
  const [state, setState] = useState<"on" | "unsupported" | "off">("off");
  useEffect(() => {
    if (!enabled) return;
    if (!("wakeLock" in navigator)) {
      setState("unsupported");
      return;
    }
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.hidden) return;
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) void lock.release();
        else {
          setState("on");
          lock.addEventListener("release", () => setState("off"));
        }
      } catch {
        setState("off");
      }
    };
    void acquire();
    const onVisible = () => {
      if (!document.hidden) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [enabled]);
  return state;
}

export default function LiveScoreboard({
  initial,
  mode,
  playerTeamId = null,
}: {
  initial: PublicScoreboard;
  mode: "tv" | "mobile";
  /** Equipo del jugador registrado en este móvil: se resalta en el marcador. */
  playerTeamId?: string | null;
}) {
  const { data, status } = useLiveScoreboard(initial);
  const { ref, moves } = useRankAnimation(data.teams);
  const myTeam = playerTeamId;

  if (mode === "tv") return <TvBoard data={data} status={status} rowRef={ref} moves={moves} />;

  const mine = data.teams.find((t) => t.id === myTeam);
  return (
    <main className="page scoreboard-mobile">
      <header className="sb-header">
        <h1 className="title page-title center">
          Marcador <span className="accent">en vivo</span>
        </h1>
        <StatusPill status={status} />
      </header>

      {mine && (
        <p className="sb-mine" aria-live="polite">
          Tu equipo, <b>{mine.name}</b>, va <b>{mine.rank}.º</b> con <b>{mine.total} puntos</b>.
        </p>
      )}

      <ol className="sb-list">
        {data.teams.map((t) => (
          <li
            key={t.id}
            ref={ref(t.id)}
            className={`sb-card ${t.id === myTeam ? "sb-card--mine" : ""} ${moves[t.id] ? `sb-move--${moves[t.id]}` : ""}`}
          >
            <span className="sb-rank" aria-label={`Puesto ${t.rank}`}>
              {t.rank}
            </span>
            <span className="sb-emblem">
              <TeamEmblem name={t.name} slug={t.slug} size={38} />
            </span>
            <span className="sb-name">
              {t.name}
              {moves[t.id] === "up" && <span className="sb-arrow sb-arrow--up"> ▲</span>}
              {moves[t.id] === "down" && <span className="sb-arrow sb-arrow--down"> ▼</span>}
            </span>
            <b className="sb-total">
              {t.total}
              <small> pts</small>
            </b>
            <dl className="sb-breakdown">
              {data.activities.map((a) => (
                <div key={a.id}>
                  <dt>{a.shortName}</dt>
                  <dd>{t.activities[a.id] ?? 0}</dd>
                </div>
              ))}
              {t.extras !== 0 && (
                <div>
                  <dt>Extra</dt>
                  <dd>{signed(t.extras)}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ol>

      <section className="parchment sb-feed-card" aria-labelledby="feed-title">
        <h2 id="feed-title">Lo último</h2>
        <Feed feed={data.feed} />
      </section>

      <p className="center small">
        <Link href="/tv">Ver en modo TV</Link> · <Link href="/">Portada</Link>
      </p>
    </main>
  );
}

function Feed({ feed }: { feed: PublicScoreboard["feed"] }) {
  if (feed.length === 0) return <p className="empty">Todavía no hay puntos. ¡Que empiece la noche!</p>;
  return (
    <ul className="sb-feed">
      {feed.map((f) => (
        <li key={f.id}>
          <span className="sb-feed__emblem" aria-hidden="true">
            <TeamEmblem name={f.text} slug={f.teamSlug} size={26} />
          </span>
          <span className="sb-feed__text">{f.text}</span>
          {signed(f.points) && (
            <b className={`sb-feed__pts ${f.points! < 0 ? "is-negative" : ""}`}>{signed(f.points)}</b>
          )}
          <time className="sb-feed__time">{timeOf(f.at)}</time>
        </li>
      ))}
    </ul>
  );
}

function TvBoard({
  data,
  status,
  rowRef,
  moves,
}: {
  data: PublicScoreboard;
  status: LiveStatus;
  rowRef: (id: string) => (el: HTMLElement | null) => void;
  moves: Record<string, "up" | "down" | "score">;
}) {
  const wake = useWakeLock(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <main className="tv">
      <header className="tv__header">
        <h1 className="tv__title">
          Gymkana <span>Halloween 2026</span>
        </h1>
        <div className="tv__meta">
          <StatusPill status={status} />
          {wake === "unsupported" && <span className="tv__hint">Pantalla: desactiva el apagado automático</span>}
          {!fullscreen && (
            <button type="button" className="inline btn-ghost" onClick={() => void document.documentElement.requestFullscreen?.()}>
              Pantalla completa
            </button>
          )}
        </div>
      </header>

      <section
        className="tv__board"
        aria-label="Clasificación"
        style={{ "--cols": data.activities.length + 1 } as React.CSSProperties}
      >
        <div className="tv__row tv__row--head" aria-hidden="true">
          <span />
          <span />
          {data.activities.map((a) => (
            <span key={a.id} className="tv__act">
              {a.shortName}
            </span>
          ))}
          <span className="tv__act">Extra</span>
          <span className="tv__act tv__act--total">Total</span>
        </div>
        {data.teams.map((t) => (
          <div
            key={t.id}
            ref={rowRef(t.id)}
            className={`tv__row ${t.rank === 1 && t.total > 0 ? "tv__row--leader" : ""} ${moves[t.id] ? `sb-move--${moves[t.id]}` : ""}`}
          >
            <WaxSeal tone={t.rank === 1 && t.total > 0 ? "gold" : "blood"}>{t.rank}</WaxSeal>
            <span className="tv__team">
              <TeamEmblem name={t.name} slug={t.slug} size={64} />
              <span className="tv__name">{t.name}</span>
              {moves[t.id] === "up" && <span className="sb-arrow sb-arrow--up">▲</span>}
              {moves[t.id] === "down" && <span className="sb-arrow sb-arrow--down">▼</span>}
            </span>
            {data.activities.map((a) => (
              <span key={a.id} className="tv__pts">
                {t.activities[a.id] ?? 0}
              </span>
            ))}
            <span className="tv__pts">{signed(t.extras) ?? 0}</span>
            <b className="tv__total">{t.total}</b>
          </div>
        ))}
      </section>

      <aside className="tv__feed" aria-label="Actividad reciente">
        <h2>Lo último</h2>
        <Feed feed={data.feed.slice(0, 7)} />
      </aside>
    </main>
  );
}
