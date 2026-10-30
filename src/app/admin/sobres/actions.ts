"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { getEnvelope } from "@/content/sobres";

export async function setEnvelopeOpen(form: FormData) {
  await requireAdmin();
  const envelope = getEnvelope(Number(form.get("envelope")));
  if (!envelope) return;

  const supabase = db();
  const { error } =
    form.get("open") === "true"
      ? await supabase.from("envelope_state").upsert({ envelope: envelope.number }, { onConflict: "envelope" })
      : await supabase.from("envelope_state").delete().eq("envelope", envelope.number);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sobres");
}
