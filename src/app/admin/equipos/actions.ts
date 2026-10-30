"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { hashJoinCode } from "@/lib/crypto";
import { db } from "@/lib/supabase";
import { isUuid } from "@/lib/validation";

async function updateTeam(form: FormData, values: Record<string, unknown>) {
  await requireAdmin();
  const id = form.get("id");
  if (!isUuid(id)) return;
  const { error } = await db().from("teams").update(values).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/equipos");
}

/** Pone o cambia el código para unirse. También quita cualquier bloqueo por intentos fallidos. */
export async function setTeamCode(form: FormData) {
  const code = String(form.get("code") ?? "").trim().slice(0, 40);
  if (code.length < 4) return;
  await updateTeam(form, { join_code_hash: hashJoinCode(code), failed_join_attempts: 0, locked_until: null });
}

export async function clearTeamCode(form: FormData) {
  await updateTeam(form, { join_code_hash: null, failed_join_attempts: 0, locked_until: null });
}

export async function setTeamActive(form: FormData) {
  await updateTeam(form, { active: form.get("active") === "true" });
}
