"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAdminName, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { notifyScoreChange } from "@/lib/realtime";
import { cleanName, isUuid } from "@/lib/validation";

export type ActionResult = { ok: true; logId: number; message: string } | { ok: false; error: string };

const STATUS_TEXT = { valid: "válida", invalid: "no válida" } as const;

/** Tras cada cambio: refresca el panel y avisa a los marcadores (sin retrasar la respuesta). */
function changed(logId: number) {
  revalidatePath("/admin/puntos", "layout");
  after(() => notifyScoreChange(logId));
}

function fail(error: unknown): ActionResult {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Error inesperado";
  console.error(error);
  return { ok: false, error: message };
}

async function names(teamId: string, taskId?: string) {
  const s = db();
  const [team, task] = await Promise.all([
    s.from("teams").select("name").eq("id", teamId).maybeSingle(),
    taskId ? s.from("score_tasks").select("label").eq("id", taskId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { team: team.data?.name ?? "?", task: (task.data as { label: string } | null)?.label ?? "?" };
}

/** Marca una prueba como válida / no válida, o la deja sin marcar (status null). Conserva la nota. */
export async function setTaskStatus(teamId: string, taskId: string, status: "valid" | "invalid" | null): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(teamId) || !isUuid(taskId)) return { ok: false, error: "Datos no válidos" };
  if (status !== null && status !== "valid" && status !== "invalid") return { ok: false, error: "Estado no válido" };
  try {
    const { data: current } = await db()
      .from("task_results")
      .select("note")
      .eq("team_id", teamId)
      .eq("task_id", taskId)
      .maybeSingle();
    const n = await names(teamId, taskId);
    const summary = `${n.team} · ${n.task}: ${status ? STATUS_TEXT[status] : "sin marcar"}`;
    const { data, error } = await db().rpc("score_set_task", {
      p_team: teamId,
      p_task: taskId,
      p_status: status,
      p_note: current?.note ?? null,
      p_actor: await getAdminName(),
      p_summary: summary,
    });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: summary };
  } catch (err) {
    return fail(err);
  }
}

/** Guarda la nota de una prueba ya marcada (o pendiente), sin cambiar su estado. */
export async function setTaskNote(teamId: string, taskId: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(teamId) || !isUuid(taskId)) return { ok: false, error: "Datos no válidos" };
  try {
    const { data: current } = await db()
      .from("task_results")
      .select("status")
      .eq("team_id", teamId)
      .eq("task_id", taskId)
      .maybeSingle();
    if (!current) return { ok: false, error: "Marca primero la prueba como válida o no válida" };
    const n = await names(teamId, taskId);
    const summary = `${n.team} · ${n.task}: nota`;
    const { data, error } = await db().rpc("score_set_task", {
      p_team: teamId,
      p_task: taskId,
      p_status: current.status,
      p_note: note.slice(0, 300),
      p_actor: await getAdminName(),
      p_summary: summary,
    });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: "Nota guardada" };
  } catch (err) {
    return fail(err);
  }
}

/** Asigna un bonus manual («la prueba más creativa») a un equipo, o lo quita (teamId null). */
export async function setAward(bonusId: string, teamId: string | null): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(bonusId) || (teamId !== null && !isUuid(teamId))) return { ok: false, error: "Datos no válidos" };
  try {
    const { data: bonus } = await db().from("score_bonuses").select("label, kind").eq("id", bonusId).maybeSingle();
    if (!bonus || bonus.kind !== "manual") return { ok: false, error: "Ese bonus no se asigna a mano" };
    const team = teamId ? (await names(teamId)).team : null;
    const summary = team ? `«${bonus.label}» → ${team}` : `«${bonus.label}» sin asignar`;
    const { data, error } = await db().rpc("score_set_award", {
      p_bonus: bonusId,
      p_team: teamId,
      p_actor: await getAdminName(),
      p_summary: summary,
    });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: summary };
  } catch (err) {
    return fail(err);
  }
}

/** Puntos extra por creatividad (positivos o negativos). */
export async function addExtra(teamId: string, points: number, reason: string): Promise<ActionResult> {
  await requireAdmin();
  if (!isUuid(teamId) || !Number.isInteger(points) || points === 0 || Math.abs(points) > 100) {
    return { ok: false, error: "Puntos no válidos (entre -100 y 100, distinto de 0)" };
  }
  try {
    const team = (await names(teamId)).team;
    const why = cleanName(reason, 120);
    const summary = `${team}: ${points > 0 ? "+" : ""}${points} extra${why ? ` (${why})` : ""}`;
    const { data, error } = await db().rpc("score_add_extra", {
      p_team: teamId,
      p_points: points,
      p_reason: why,
      p_actor: await getAdminName(),
      p_summary: summary,
    });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: summary };
  } catch (err) {
    return fail(err);
  }
}

/** Deshace una acción concreta (botón «Deshacer» del aviso). */
export async function undoAction(logId: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(logId) || logId <= 0) return { ok: false, error: "Acción no válida" };
  try {
    const { data, error } = await db().rpc("score_undo", { p_log_id: logId, p_actor: await getAdminName() });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: "Deshecho" };
  } catch (err) {
    return fail(err);
  }
}

/** Deshace la última acción de puntuación, sea cual sea. */
export async function undoLast(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { data, error } = await db().rpc("score_undo_last", { p_actor: await getAdminName() });
    if (error) return fail(error);
    changed(data as number);
    return { ok: true, logId: data as number, message: "Última acción deshecha" };
  } catch (err) {
    return fail(err);
  }
}
