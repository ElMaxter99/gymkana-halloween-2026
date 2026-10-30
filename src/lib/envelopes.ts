import "server-only";
import { db } from "./supabase";

/** Sobres abiertos por el organizador → fecha de apertura. */
export async function getOpenEnvelopes(): Promise<Map<number, string>> {
  const { data, error } = await db().from("envelope_state").select("envelope, opened_at");
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.envelope as number, r.opened_at as string]));
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
