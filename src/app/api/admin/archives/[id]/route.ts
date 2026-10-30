import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";

type Scan = { scanned_at: string; player: string; team: string; point: string };
type Player = { name: string; team: string; created_at: string; active: boolean };

function csvCell(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Descarga de una copia: CSV de escaneos (para Excel) o JSON legible. Sin hashes ni datos internos. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { data: archive, error } = await db()
    .from("game_archives")
    .select("id, label, archived_at, data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!archive) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const scans = (archive.data?.scans ?? []) as Scan[];
  const players = (archive.data?.players ?? []) as Player[];
  const name = `partida-${archive.id}`;
  const format = new URL(req.url).searchParams.get("formato");

  if (format === "csv") {
    const rows = [
      ["Fecha y hora", "Jugador", "Equipo", "Punto QR"],
      ...scans.map((s) => [formatDateTime(s.scanned_at), s.player, s.team, s.point]),
    ];
    // BOM para que Excel abra bien los acentos; «;» como separador en configuración española.
    const csv = "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${name}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  return NextResponse.json(
    { id: archive.id, label: archive.label, archived_at: archive.archived_at, players, scans },
    {
      headers: {
        "content-disposition": `attachment; filename="${name}.json"`,
        "cache-control": "no-store",
      },
    },
  );
}
