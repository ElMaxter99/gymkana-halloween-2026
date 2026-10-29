import { NextResponse } from "next/server";
import { DEVICE_COOKIE } from "@/lib/player";

/** Olvida la identidad de este dispositivo (para cambiar de jugador o equipo). */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEVICE_COOKIE);
  return res;
}
