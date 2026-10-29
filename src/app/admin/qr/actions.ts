"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";

function randomSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function field(form: FormData, name: string, max: number): string {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

export async function createPoint(form: FormData) {
  await requireAdmin();
  const title = field(form, "title", 80);
  if (!title) return;
  const custom = slugify(field(form, "slug", 64));
  // Un sufijo aleatorio hace la URL difícil de adivinar aunque el título sea obvio.
  const slug = custom.length >= 3 ? custom : `${slugify(title) || "qr"}-${randomSlug()}`;

  const { error } = await db().from("qr_points").insert({
    title,
    slug,
    instructions: field(form, "instructions", 4000),
    sort_order: Number(form.get("sort_order")) || 0,
  });
  if (error) throw new Error(error.code === "23505" ? "Ese slug ya existe" : error.message);
  revalidatePath("/admin/qr");
}

export async function updatePoint(form: FormData) {
  await requireAdmin();
  const id = field(form, "id", 64);
  const title = field(form, "title", 80);
  if (!id || !title) return;
  const { error } = await db()
    .from("qr_points")
    .update({
      title,
      instructions: field(form, "instructions", 4000),
      sort_order: Number(form.get("sort_order")) || 0,
      active: form.get("active") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/qr");
}
