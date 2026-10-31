"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { localToUtc } from "@/lib/time";
import { getEnvelope } from "@/content/sobres";

function refresh() {
  revalidatePath("/admin/sobres");
  revalidatePath("/sobres", "layout");
}

/** Abrir a mano, o volver a sellar (sellar también quita la apertura programada). */
export async function setEnvelopeOpen(form: FormData) {
  await requireAdmin();
  const envelope = getEnvelope(Number(form.get("envelope")));
  if (!envelope) return;

  const supabase = db();
  if (form.get("open") === "true") {
    const { error } = await supabase.from("envelope_state").upsert({ envelope: envelope.number }, { onConflict: "envelope" });
    if (error) throw new Error(error.message);
  } else {
    const [a, b] = await Promise.all([
      supabase.from("envelope_state").delete().eq("envelope", envelope.number),
      supabase.from("envelope_schedule").delete().eq("envelope", envelope.number),
    ]);
    if (a.error) throw new Error(a.error.message);
    if (b.error) throw new Error(b.error.message);
  }
  refresh();
}

/** Programa la apertura automática (hora del evento, p. ej. Europe/Madrid). */
export async function scheduleEnvelope(form: FormData) {
  await requireAdmin();
  const envelope = getEnvelope(Number(form.get("envelope")));
  if (!envelope) return;
  const at = localToUtc(String(form.get("open_at") ?? ""));
  if (!at) redirect(`/admin/sobres?error=${encodeURIComponent("Elige una fecha y hora válidas")}#sobre-${envelope.number}`);

  const { error } = await db()
    .from("envelope_schedule")
    .upsert({ envelope: envelope.number, open_at: at.toISOString() }, { onConflict: "envelope" });
  if (error) throw new Error(error.message);
  refresh();
}

export async function clearEnvelopeSchedule(form: FormData) {
  await requireAdmin();
  const envelope = getEnvelope(Number(form.get("envelope")));
  if (!envelope) return;
  const { error } = await db().from("envelope_schedule").delete().eq("envelope", envelope.number);
  if (error) throw new Error(error.message);
  refresh();
}
