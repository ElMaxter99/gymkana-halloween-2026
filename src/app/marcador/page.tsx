import type { Metadata } from "next";
import { getPublicScoreboard } from "@/lib/scoreboard";
import { getCurrentPlayer } from "@/lib/player";
import LiveScoreboard from "@/components/LiveScoreboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Marcador · Gymkana Halloween 2026" };

/** Marcador público para el móvil (sin login, solo lectura). */
export default async function ScoreboardPage() {
  const [initial, player] = await Promise.all([getPublicScoreboard(), getCurrentPlayer()]);
  return <LiveScoreboard initial={initial} mode="mobile" playerTeamId={player?.teamId ?? null} />;
}
