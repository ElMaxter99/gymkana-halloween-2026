/**
 * Cálculo del marcador. Función pura (sin base de datos ni React): la usa el servidor
 * para el panel y para el marcador público, y la cubren los tests de scoring.test.ts.
 * Nunca se guardan totales: se recalcula en cada lectura, así que cambiar los puntos
 * de una prueba o un bonus actualiza todo al momento.
 */

export type ScoreActivity = { id: string; name: string; shortName?: string; sortOrder: number };

export type ScoreTask = {
  id: string;
  activityId: string;
  label: string;
  points: number;
  groupLabel: string | null;
  sortOrder: number;
  /** Si cuenta para los bonus «todas» / «al menos N» (el grito de guerra no). */
  countsForBonus: boolean;
  /** Localización con QR: solo aplica a los equipos de la ruta de ese QR. */
  qrPointId: string | null;
  active: boolean;
};

export type BonusKind = "all" | "min" | "manual";

export type ScoreBonus = {
  id: string;
  activityId: string;
  label: string;
  kind: BonusKind;
  threshold: number | null;
  points: number;
  sortOrder: number;
  active: boolean;
};

export type TaskStatus = "pending" | "valid" | "invalid";

export type ScoreInput = {
  teams: { id: string; name: string; slug: string | null; sortOrder: number }[];
  activities: ScoreActivity[];
  tasks: ScoreTask[];
  bonuses: ScoreBonus[];
  results: { teamId: string; taskId: string; status: TaskStatus }[];
  awards: { bonusId: string; teamId: string }[];
  extras: { teamId: string; points: number }[];
  /** Ruta de cada QR: equipos que lo tienen asignado (null o vacío = todos). */
  qrRoutes: Record<string, string[] | null>;
};

export type BonusStatus = {
  bonusId: string;
  label: string;
  kind: BonusKind;
  points: number;
  achieved: boolean;
  /** «8/8», «3/5»; en los manuales, vacío. */
  progress: string;
};

export type ActivityScore = {
  activityId: string;
  name: string;
  points: number;
  taskPoints: number;
  bonusPoints: number;
  /** Pruebas válidas que cuentan para los bonus / pruebas que le tocan al equipo. */
  valid: number;
  applicable: number;
  bonuses: BonusStatus[];
};

export type TeamScore = {
  teamId: string;
  name: string;
  slug: string | null;
  total: number;
  extras: number;
  /** Puesto con empates: dos equipos con los mismos puntos comparten puesto (1, 1, 3…). */
  rank: number;
  activities: ActivityScore[];
};

/** ¿Le toca esta prueba al equipo? Las de QR solo a los equipos de su ruta. */
export function isTaskApplicable(task: ScoreTask, teamId: string, qrRoutes: ScoreInput["qrRoutes"]): boolean {
  if (!task.active) return false;
  if (!task.qrPointId) return true;
  const route = qrRoutes[task.qrPointId];
  return !route || route.length === 0 || route.includes(teamId);
}

const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

export function computeScores(input: ScoreInput): TeamScore[] {
  const status = new Map(input.results.map((r) => [`${r.teamId}:${r.taskId}`, r.status]));
  const awardTeam = new Map(input.awards.map((a) => [a.bonusId, a.teamId]));
  const activities = [...input.activities].sort(bySort);

  const scores: TeamScore[] = input.teams.map((team) => {
    const activityScores = activities.map((activity): ActivityScore => {
      const tasks = input.tasks.filter(
        (t) => t.activityId === activity.id && isTaskApplicable(t, team.id, input.qrRoutes),
      );
      const isValid = (t: ScoreTask) => status.get(`${team.id}:${t.id}`) === "valid";

      const taskPoints = tasks.filter(isValid).reduce((sum, t) => sum + t.points, 0);
      const bonusTasks = tasks.filter((t) => t.countsForBonus);
      const valid = bonusTasks.filter(isValid).length;

      const bonuses = input.bonuses
        .filter((b) => b.activityId === activity.id && b.active)
        .sort(bySort)
        .map((b): BonusStatus => {
          let achieved = false;
          let progress = "";
          if (b.kind === "all") {
            achieved = bonusTasks.length > 0 && valid === bonusTasks.length;
            progress = `${valid}/${bonusTasks.length}`;
          } else if (b.kind === "min") {
            const needed = b.threshold ?? bonusTasks.length;
            achieved = valid >= needed;
            progress = `${Math.min(valid, needed)}/${needed}`;
          } else {
            achieved = awardTeam.get(b.id) === team.id;
          }
          return { bonusId: b.id, label: b.label, kind: b.kind, points: b.points, achieved, progress };
        });

      const bonusPoints = bonuses.filter((b) => b.achieved).reduce((sum, b) => sum + b.points, 0);
      return {
        activityId: activity.id,
        name: activity.name,
        points: taskPoints + bonusPoints,
        taskPoints,
        bonusPoints,
        valid,
        applicable: bonusTasks.length,
        bonuses,
      };
    });

    const extras = input.extras.filter((e) => e.teamId === team.id).reduce((sum, e) => sum + e.points, 0);
    const total = activityScores.reduce((sum, a) => sum + a.points, 0) + extras;
    return { teamId: team.id, name: team.name, slug: team.slug, total, extras, rank: 0, activities: activityScores };
  });

  const order = new Map(input.teams.map((t) => [t.id, t.sortOrder]));
  scores.sort((a, b) => b.total - a.total || (order.get(a.teamId) ?? 0) - (order.get(b.teamId) ?? 0));
  for (const s of scores) s.rank = 1 + scores.filter((o) => o.total > s.total).length;
  return scores;
}
