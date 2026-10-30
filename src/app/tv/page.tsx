import type { Metadata } from "next";
import { getPublicScoreboard } from "@/lib/scoreboard";
import LiveScoreboard from "@/components/LiveScoreboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Marcador TV · Gymkana Halloween 2026" };

/** Marcador para la tele de casa: pantalla completa, letra grande, sin scroll. */
export default async function TvPage() {
  return <LiveScoreboard initial={await getPublicScoreboard()} mode="tv" />;
}
