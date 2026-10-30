import "server-only";
import { db } from "./supabase";
import { computeScores, type ScoreInput, type TaskStatus, type TeamScore } from "./scoring";

export type FullScoreData = {
  version: number;
  input: ScoreInput;
  scores: TeamScore[];
  /** Notas y estados por equipo y prueba: solo para el panel del organizador. */
  results: { teamId: string; taskId: string; status: TaskStatus; note: string | null; updatedAt: string }[];
  awards: { bonusId: string; teamId: string }[];
};

/** Versión del marcador = id de la última entrada del historial. */
export async function getScoreVersion(): Promise<number> {
  const { data, error } = await db().from("score_log").select("id").order("id", { ascending: false }).limit(1);
  if (error) throw error;
  return (data?.[0]?.id as number | undefined) ?? 0;
}

export async function loadScoreData(): Promise<FullScoreData> {
  const s = db();
  const [teams, activities, tasks, bonuses, results, awards, extras, qr, version] = await Promise.all([
    s.from("teams").select("id, name, slug, sort_order").eq("active", true).order("sort_order").order("created_at"),
    s.from("score_activities").select("id, name, short_name, sort_order").order("sort_order"),
    s.from("score_tasks").select("id, activity_id, label, points, group_label, sort_order, counts_for_bonus, qr_point_id, active").order("sort_order"),
    s.from("score_bonuses").select("id, activity_id, label, kind, threshold, points, sort_order, active").order("sort_order"),
    s.from("task_results").select("team_id, task_id, status, note, updated_at"),
    s.from("bonus_awards").select("bonus_id, team_id"),
    s.from("score_extras").select("team_id, points"),
    s.from("qr_points").select("id, assigned_team_ids"),
    getScoreVersion(),
  ]);
  for (const r of [teams, activities, tasks, bonuses, results, awards, extras, qr]) if (r.error) throw r.error;

  const input: ScoreInput = {
    teams: (teams.data ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug, sortOrder: t.sort_order })),
    activities: (activities.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      shortName: a.short_name ?? a.name,
      sortOrder: a.sort_order,
    })),
    tasks: (tasks.data ?? []).map((t) => ({
      id: t.id,
      activityId: t.activity_id,
      label: t.label,
      points: t.points,
      groupLabel: t.group_label,
      sortOrder: t.sort_order,
      countsForBonus: t.counts_for_bonus,
      qrPointId: t.qr_point_id,
      active: t.active,
    })),
    bonuses: (bonuses.data ?? []).map((b) => ({
      id: b.id,
      activityId: b.activity_id,
      label: b.label,
      kind: b.kind,
      threshold: b.threshold,
      points: b.points,
      sortOrder: b.sort_order,
      active: b.active,
    })),
    results: (results.data ?? []).map((r) => ({ teamId: r.team_id, taskId: r.task_id, status: r.status })),
    awards: (awards.data ?? []).map((a) => ({ bonusId: a.bonus_id, teamId: a.team_id })),
    extras: (extras.data ?? []).map((e) => ({ teamId: e.team_id, points: e.points })),
    qrRoutes: Object.fromEntries((qr.data ?? []).map((q) => [q.id, q.assigned_team_ids ?? null])),
  };

  return {
    version,
    input,
    scores: computeScores(input),
    results: (results.data ?? []).map((r) => ({
      teamId: r.team_id,
      taskId: r.task_id,
      status: r.status,
      note: r.note,
      updatedAt: r.updated_at,
    })),
    awards: input.awards,
  };
}

/* ---------- Marcador público (sin notas, historial ni datos del panel) ---------- */

export type FeedItem = { id: number; at: string; teamSlug: string | null; text: string; points: number | null };

export type PublicScoreboard = {
  version: number;
  generatedAt: string;
  activities: { id: string; name: string; shortName: string }[];
  teams: {
    id: string;
    slug: string | null;
    name: string;
    rank: number;
    total: number;
    extras: number;
    activities: Record<string, number>;
  }[];
  feed: FeedItem[];
};

const FEED_SIZE = 12;

/** Eventos recientes legibles («Bruja completó La Harley +2»), desde el último reinicio. */
async function buildFeed(input: ScoreInput): Promise<FeedItem[]> {
  const { data, error } = await db()
    .from("score_log")
    .select("id, at, action, team_id, target, after, undone")
    .in("action", ["task", "award", "extra", "qr", "reset"])
    .order("id", { ascending: false })
    .limit(150);
  if (error) throw error;

  const team = new Map(input.teams.map((t) => [t.id, t]));
  const task = new Map(input.tasks.map((t) => [t.id, t]));
  const bonus = new Map(input.bonuses.map((b) => [b.id, b]));
  const { data: qrs } = await db().from("qr_points").select("id, title");
  const qrTitle = new Map((qrs ?? []).map((q) => [q.id, q.title]));

  const feed: FeedItem[] = [];
  for (const row of data ?? []) {
    if (row.action === "reset") break; // lo anterior es de otra partida
    if (row.undone || feed.length >= FEED_SIZE) continue;
    const t = team.get(row.team_id);
    if (!t) continue;
    const after = row.after as Record<string, unknown> | null;
    let text: string | null = null;
    let points: number | null = null;

    if (row.action === "task" && after?.status === "valid") {
      const k = task.get(row.target);
      if (!k) continue;
      text = `${t.name} completó ${k.label}`;
      points = k.points;
    } else if (row.action === "award" && after) {
      const b = bonus.get(row.target);
      if (!b) continue;
      text = `${t.name} gana «${b.label}»`;
      points = b.points;
    } else if (row.action === "extra" && after) {
      points = Number(after.points);
      text = `${t.name}: ${points > 0 ? "puntos" : "penalización"} por creatividad`;
    } else if (row.action === "qr") {
      text = `${t.name} encontró el QR de ${qrTitle.get(row.target) ?? "una localización"}`;
    }
    if (text) feed.push({ id: row.id, at: row.at, teamSlug: t.slug, text, points });
  }
  return feed;
}

export async function getPublicScoreboard(): Promise<PublicScoreboard> {
  const { version, input, scores } = await loadScoreData();
  return {
    version,
    generatedAt: new Date().toISOString(),
    activities: [...input.activities].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => ({ id: a.id, name: a.name, shortName: a.shortName ?? a.name })),
    teams: scores.map((s) => ({
      id: s.teamId,
      slug: s.slug,
      name: s.name,
      rank: s.rank,
      total: s.total,
      extras: s.extras,
      activities: Object.fromEntries(s.activities.map((a) => [a.activityId, a.points])),
    })),
    feed: await buildFeed(input),
  };
}
