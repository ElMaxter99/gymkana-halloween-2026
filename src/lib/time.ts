import { TIMEZONE } from "./format.ts";

/** Desfase (ms) de una zona horaria en un instante: hora local − UTC. */
function zoneOffset(utcMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

/**
 * «2026-10-31T22:30» (lo que devuelve un <input type="datetime-local">) en la hora del evento → fecha UTC.
 * Funciona también en los cambios de horario de verano.
 */
export function localToUtc(local: string, timeZone = TIMEZONE): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let utc = naive - zoneOffset(naive, timeZone);
  utc = naive - zoneOffset(utc, timeZone);
  const d = new Date(utc);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha → «2026-10-31T22:30» en la hora del evento (para rellenar un <input type="datetime-local">). */
export function utcToLocalInput(iso: string, timeZone = TIMEZONE): string {
  const ms = new Date(iso).getTime();
  const local = new Date(ms + zoneOffset(ms, timeZone));
  return local.toISOString().slice(0, 16);
}
