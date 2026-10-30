import { NextResponse } from "next/server";
import { getPublicScoreboard } from "@/lib/scoreboard";

export const dynamic = "force-dynamic";

/**
 * Marcador público de solo lectura (sin login). Solo devuelve datos públicos:
 * nada de notas, historial ni configuración.
 *
 * Caché en el CDN de Vercel: las pantallas piden «?v=<versión>» al recibir el aviso de tiempo real,
 * así 30 móviles comparten una sola respuesta por cambio; el sondeo de respaldo (sin «v») se cachea 2 s.
 */
export async function GET(req: Request) {
  const data = await getPublicScoreboard();
  const versioned = new URL(req.url).searchParams.has("v");
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": versioned
        ? "public, max-age=0, s-maxage=30"
        : "public, max-age=0, s-maxage=2, stale-while-revalidate=4",
    },
  });
}
