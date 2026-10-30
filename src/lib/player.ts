import "server-only";
import { cookies } from "next/headers";
import { db } from "./supabase";
import { sha256 } from "./crypto";
import { SLUG_RE } from "./validation";

export const DEVICE_COOKIE = "gk_device";
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type CurrentPlayer = {
  id: string;
  displayName: string;
  teamId: string;
  teamName: string;
  teamSlug: string | null;
};

/** Devuelve el jugador asociado a la cookie de este dispositivo, o null. */
export async function getCurrentPlayer(): Promise<CurrentPlayer | null> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await db()
    .from("players")
    .select("id, display_name, team_id, active, team:teams!inner(name, slug, active)")
    .eq("device_token_hash", sha256(token))
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.active) return null;
  const team = data.team as unknown as { name: string; slug: string | null; active: boolean };
  if (!team.active) return null;

  return {
    id: data.id,
    displayName: data.display_name,
    teamId: data.team_id,
    teamName: team.name,
    teamSlug: team.slug,
  };
}

/** Solo se permiten redirecciones internas a páginas de QR. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/p/")) return null;
  return SLUG_RE.test(next.slice(3)) ? next : null;
}
