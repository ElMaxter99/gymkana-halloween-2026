import "server-only";
import { db } from "./supabase";

export type Overview = {
  generatedAt: string;
  teams: {
    id: string;
    name: string;
    createdAt: string;
    players: { id: string; name: string; createdAt: string; active: boolean }[];
  }[];
  points: { id: string; slug: string; title: string; active: boolean }[];
  /** Primer escaneo y número de escaneos por equipo y punto: progress[teamId][pointId] */
  progress: Record<string, Record<string, { first: string; count: number }>>;
  totalScans: number;
  /** Últimos RECENT_LIMIT escaneos, del más reciente al más antiguo. */
  recentScans: {
    id: number;
    scannedAt: string;
    playerId: string;
    playerName: string;
    teamId: string;
    teamName: string;
    pointId: string;
    pointTitle: string;
    /** Primer escaneo de ese equipo en ese punto. */
    first: boolean;
  }[];
  recentLimit: number;
};

type One<T> = T | T[] | null;
function one<T>(v: One<T>): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const RECENT_LIMIT = 500;

export async function getOverview(): Promise<Overview> {
  const supabase = db();

  const [teamsRes, playersRes, pointsRes, recentRes, allRes] = await Promise.all([
    supabase.from("teams").select("id, name, created_at").order("created_at"),
    supabase.from("players").select("id, display_name, team_id, created_at, active").order("created_at"),
    supabase.from("qr_points").select("id, slug, title, active").order("sort_order").order("created_at"),
    supabase
      .from("scan_events")
      .select(
        "id, scanned_at, player_id, team_id, qr_point_id, player:players(display_name), team:teams(name), point:qr_points(title)",
      )
      .order("scanned_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("scan_events")
      .select("id, team_id, qr_point_id, scanned_at", { count: "exact" })
      .order("scanned_at")
      .order("id")
      .limit(10000),
  ]);

  for (const r of [teamsRes, playersRes, pointsRes, recentRes, allRes]) {
    if (r.error) throw r.error;
  }

  const progress: Overview["progress"] = {};
  const firstIds = new Set<number>();
  for (const s of allRes.data ?? []) {
    const byPoint = (progress[s.team_id] ??= {});
    const entry = byPoint[s.qr_point_id];
    if (entry) entry.count++;
    else {
      byPoint[s.qr_point_id] = { first: s.scanned_at, count: 1 };
      firstIds.add(s.id);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    teams: (teamsRes.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
      players: (playersRes.data ?? [])
        .filter((p) => p.team_id === t.id)
        .map((p) => ({ id: p.id, name: p.display_name, createdAt: p.created_at, active: p.active })),
    })),
    points: pointsRes.data ?? [],
    progress,
    totalScans: allRes.count ?? 0,
    recentLimit: RECENT_LIMIT,
    recentScans: (recentRes.data ?? []).map((s) => ({
      id: s.id,
      scannedAt: s.scanned_at,
      playerId: s.player_id,
      playerName: one(s.player as One<{ display_name: string }>)?.display_name ?? "?",
      teamId: s.team_id,
      teamName: one(s.team as One<{ name: string }>)?.name ?? "?",
      pointId: s.qr_point_id,
      pointTitle: one(s.point as One<{ title: string }>)?.title ?? "?",
      first: firstIds.has(s.id),
    })),
  };
}
