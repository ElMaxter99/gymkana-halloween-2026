import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { loadScoreData } from "@/lib/scoreboard";
import { isTaskApplicable } from "@/lib/scoring";
import PuntosPanel, { type PanelActivity } from "./PuntosPanel";

export const dynamic = "force-dynamic";

export default async function PuntosPage({ searchParams }: { searchParams: Promise<{ equipo?: string }> }) {
  await requireAdmin();
  const data = await loadScoreData();
  const { input, scores } = data;
  if (input.teams.length === 0) {
    return (
      <main className="page-wide admin">
        <p className="muted">No hay equipos activos. Ejecuta supabase/schema.sql.</p>
      </main>
    );
  }

  const wanted = (await searchParams).equipo;
  const team = input.teams.find((t) => t.id === wanted) ?? input.teams[0];
  const score = scores.find((s) => s.teamId === team.id)!;
  const result = new Map(data.results.filter((r) => r.teamId === team.id).map((r) => [r.taskId, r]));
  const awardTeam = new Map(data.awards.map((a) => [a.bonusId, a.teamId]));

  const activities: PanelActivity[] = [...input.activities]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => {
      const s = score.activities.find((x) => x.activityId === a.id)!;
      return {
        id: a.id,
        name: a.name,
        points: s.points,
        bonuses: s.bonuses.map((b) => ({ ...b, awardedTeamId: awardTeam.get(b.bonusId) ?? null })),
        tasks: input.tasks
          .filter((t) => t.activityId === a.id && isTaskApplicable(t, team.id, input.qrRoutes))
          .sort((x, y) => x.sortOrder - y.sortOrder)
          .map((t) => ({
            id: t.id,
            label: t.label,
            points: t.points,
            group: t.groupLabel,
            isQr: Boolean(t.qrPointId),
            status: result.get(t.id)?.status ?? null,
            note: result.get(t.id)?.note ?? null,
          })),
      };
    });

  const { data: extras } = await db()
    .from("score_extras")
    .select("id, points, reason, created_at")
    .eq("team_id", team.id)
    .order("id", { ascending: false });

  return (
    <PuntosPanel
      version={data.version}
      team={{ id: team.id, name: team.name, slug: team.slug, total: score.total, rank: score.rank, extras: score.extras }}
      teams={scores.map((s) => ({ id: s.teamId, name: s.name, slug: s.slug, total: s.total, rank: s.rank }))}
      activities={activities}
      extras={(extras ?? []).map((e) => ({ id: e.id, points: e.points, reason: e.reason, at: e.created_at }))}
    />
  );
}
