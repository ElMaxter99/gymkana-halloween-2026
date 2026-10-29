import Link from "next/link";
import { getCurrentPlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

export default async function Home() {
  const player = await getCurrentPlayer();

  return (
    <main className="page">
      <div className="emoji-hero">🎃</div>
      <h1 className="center">Gymkana Halloween 2026</h1>

      {player ? (
        <>
          <div className="team-banner">
            Eres <b>{player.displayName}</b> del equipo
            <strong>{player.teamName}</strong>
          </div>
          <div className="card">
            <p>Ya estás identificado. Cuando encontréis un QR escondido, escanéalo con la cámara del móvil y aparecerá aquí vuestra prueba.</p>
            <p className="muted small">Las fotos y vídeos se envían por WhatsApp al coordinador.</p>
          </div>
        </>
      ) : (
        <div className="card">
          <p>Para jugar, primero registra tu equipo o únete al de tus compañeros.</p>
          <Link className="button" href="/registro">Registrarme</Link>
        </div>
      )}
    </main>
  );
}
