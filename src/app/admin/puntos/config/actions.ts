"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getAdminName, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { notifyScoreChange } from "@/lib/realtime";
import { cleanName, isUuid } from "@/lib/validation";

const PAGE = "/admin/puntos/config";

function back(params: Record<string, string>): never {
  redirect(`${PAGE}?${new URLSearchParams(params)}`);
}

function points(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < -100 || n > 100) back({ error: "Los puntos deben ser un número entero entre -100 y 100" });
  return n;
}

/** Registra el cambio en el historial, avisa a los marcadores (todo se recalcula) y vuelve a la página. */
async function done(summary: string, anchor: string): Promise<never> {
  const { data } = await db().rpc("score_log_config", { p_actor: await getAdminName(), p_summary: summary });
  revalidatePath("/admin/puntos", "layout");
  after(() => notifyScoreChange(data as number));
  back({ ok: summary, at: anchor });
}

export async function renameTeam(form: FormData) {
  await requireAdmin();
  const id = form.get("id");
  const name = cleanName(form.get("name"), 40);
  if (!isUuid(id) || name.length < 2) back({ error: "El nombre del equipo debe tener al menos 2 caracteres" });
  const { error } = await db().from("teams").update({ name }).eq("id", id);
  if (error) back({ error: error.code === "23505" ? "Ya hay un equipo con ese nombre" : error.message });
  await done(`Equipo renombrado a «${name}»`, "equipos");
}

export async function updateActivity(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const name = cleanName(form.get("name"), 80);
  const shortName = cleanName(form.get("short_name"), 20) || name;
  if (!id || !name) back({ error: "La actividad necesita un nombre" });
  const { error } = await db().from("score_activities").update({ name, short_name: shortName }).eq("id", id);
  if (error) back({ error: error.message });
  await done(`Actividad «${name}» actualizada`, `act-${id}`);
}

export async function updateTask(form: FormData) {
  await requireAdmin();
  const id = form.get("id");
  const label = cleanName(form.get("label"), 160);
  if (!isUuid(id) || !label) back({ error: "La prueba necesita un nombre" });
  const pts = points(form.get("points"));
  const { data: task, error } = await db()
    .from("score_tasks")
    .update({
      label,
      points: pts,
      group_label: cleanName(form.get("group_label"), 40) || null,
      active: form.get("active") === "on",
      counts_for_bonus: form.get("counts_for_bonus") === "on",
    })
    .eq("id", id)
    .select("activity_id")
    .single();
  if (error) back({ error: error.message });
  await done(`Prueba «${label}»: ${pts} pts`, `act-${task.activity_id}`);
}

export async function addTask(form: FormData) {
  await requireAdmin();
  const activityId = String(form.get("activity_id") ?? "");
  const label = cleanName(form.get("label"), 160);
  if (!activityId || !label) back({ error: "La prueba necesita un nombre" });
  const pts = points(form.get("points"));
  const { data: last } = await db()
    .from("score_tasks")
    .select("sort_order")
    .eq("activity_id", activityId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { error } = await db().from("score_tasks").insert({
    activity_id: activityId,
    label,
    points: pts,
    group_label: cleanName(form.get("group_label"), 40) || null,
    sort_order: (last?.[0]?.sort_order ?? 0) + 1,
  });
  if (error) back({ error: error.message });
  await done(`Prueba añadida: «${label}» (${pts} pts)`, `act-${activityId}`);
}

export async function updateBonus(form: FormData) {
  await requireAdmin();
  const id = form.get("id");
  const label = cleanName(form.get("label"), 120);
  if (!isUuid(id) || !label) back({ error: "El bonus necesita un nombre" });
  const pts = points(form.get("points"));
  const rawThreshold = form.get("threshold");
  const threshold = rawThreshold === null || rawThreshold === "" ? null : Number(rawThreshold);
  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 1)) back({ error: "El mínimo debe ser un entero positivo" });
  const { data: bonus, error } = await db()
    .from("score_bonuses")
    .update({ label, points: pts, threshold, active: form.get("active") === "on" })
    .eq("id", id)
    .select("activity_id")
    .single();
  if (error) back({ error: error.message });
  await done(`Bonus «${label}»: ${pts} pts`, `act-${bonus.activity_id}`);
}

export async function resetScores(form: FormData) {
  await requireAdmin();
  if (String(form.get("confirm") ?? "").trim().toUpperCase() !== "REINICIAR") {
    back({ error: "Para reiniciar escribe REINICIAR", at: "peligro" });
  }
  const { data, error } = await db().rpc("score_reset", { p_actor: await getAdminName() });
  if (error) back({ error: error.message, at: "peligro" });
  revalidatePath("/admin/puntos", "layout");
  after(() => notifyScoreChange(data as number));
  back({ ok: "Marcador reiniciado: todos los equipos a 0", at: "peligro" });
}
