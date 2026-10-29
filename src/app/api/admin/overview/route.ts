import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await getOverview(), {
    headers: { "cache-control": "no-store" },
  });
}
