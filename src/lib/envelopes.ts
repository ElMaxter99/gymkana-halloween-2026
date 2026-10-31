import "server-only";
import { db } from "./supabase";

export type EnvelopeStatus = {
  /** Abierto (a mano o porque ya llegó su hora) y desde cuándo. */
  openedAt: string | null;
  /** Abierto a mano por el organizador. */
  manual: boolean;
  /** Apertura automática programada (pasada o futura). */
  scheduledAt: string | null;
};

/** Estado de cada sobre: abierto a mano, abierto por su hora programada o sellado. */
export async function getEnvelopeStatuses(): Promise<Map<number, EnvelopeStatus>> {
  const s = db();
  const [manual, schedule] = await Promise.all([
    s.from("envelope_state").select("envelope, opened_at"),
    s.from("envelope_schedule").select("envelope, open_at"),
  ]);
  if (manual.error) throw manual.error;
  // Si falta la tabla de programación (esquema sin actualizar), los sobres siguen funcionando a mano.
  if (schedule.error) console.error("Sobres: no se pudo leer la programación", schedule.error.message);

  const now = Date.now();
  const statuses = new Map<number, EnvelopeStatus>();
  for (const r of schedule.data ?? []) {
    const due = new Date(r.open_at).getTime() <= now;
    statuses.set(r.envelope, { openedAt: due ? r.open_at : null, manual: false, scheduledAt: r.open_at });
  }
  for (const r of manual.data ?? []) {
    const prev = statuses.get(r.envelope);
    // Si se abrió a mano y también tenía hora, cuenta la apertura más temprana
    const openedAt = prev?.openedAt && prev.openedAt < r.opened_at ? prev.openedAt : r.opened_at;
    statuses.set(r.envelope, { openedAt, manual: true, scheduledAt: prev?.scheduledAt ?? null });
  }
  return statuses;
}

/** Sobres abiertos → fecha de apertura (a mano o automática). */
export async function getOpenEnvelopes(): Promise<Map<number, string>> {
  const open = new Map<number, string>();
  for (const [n, st] of await getEnvelopeStatuses()) if (st.openedAt) open.set(n, st.openedAt);
  return open;
}

/** Prefijos de URL de los QR que ya ha escaneado un equipo (para marcar el mapa). */
export async function getScannedQrPrefixes(teamId: string): Promise<Set<string>> {
  const { data, error } = await db().from("scan_events").select("point:qr_points(slug)").eq("team_id", teamId);
  if (error) throw error;
  const prefixes = new Set<string>();
  for (const row of data ?? []) {
    const point = (Array.isArray(row.point) ? row.point[0] : row.point) as { slug: string } | null;
    if (point?.slug) prefixes.add(point.slug.split("-")[0]);
  }
  return prefixes;
}
