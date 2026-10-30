import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase";
import { sha256 } from "@/lib/crypto";
import { DEVICE_COOKIE } from "@/lib/player";

/**
 * Olvida la identidad de este dispositivo (para cambiar de jugador o equipo).
 * El jugador se marca como inactivo para que no aparezca duplicado al registrarse de nuevo;
 * sus escaneos anteriores se conservan.
 */
export async function POST() {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (token) {
    const { error } = await db()
      .from("players")
      .update({ active: false })
      .eq("device_token_hash", sha256(token));
    if (error) console.error(error);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEVICE_COOKIE);
  return res;
}
