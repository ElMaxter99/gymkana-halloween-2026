"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { cleanName } from "@/lib/validation";

/** Guarda la partida actual en una copia y deja jugadores y escaneos a cero. */
export async function startNewGame(form: FormData) {
  await requireAdmin();
  if (form.get("confirm") !== "on") redirect("/admin/partidas?hecho=sin-confirmar");

  const { error } = await db().rpc("archive_game", { p_label: cleanName(form.get("label"), 80) });
  if (error) {
    console.error(error);
    redirect("/admin/partidas?hecho=error");
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/partidas?hecho=nueva");
}

/** Vuelve a poner en juego una copia (antes guarda la partida actual si tiene datos). */
export async function restoreGame(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/partidas?hecho=error");
  if (form.get("confirm") !== "on") redirect("/admin/partidas?hecho=sin-confirmar");

  const { error } = await db().rpc("restore_game", { p_id: id });
  if (error) {
    console.error(error);
    redirect("/admin/partidas?hecho=error");
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/partidas?hecho=restaurada");
}
