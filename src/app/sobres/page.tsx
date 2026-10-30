import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/player";
import { getOpenEnvelopes } from "@/lib/envelopes";
import { ENVELOPES } from "@/content/sobres";
import { EnvelopeTitle } from "@/components/EnvelopeView";
import { TeamBanner } from "@/components/ui";
import { ArrowLeftIcon, SkullCrossbones, WaxSeal } from "@/components/ornaments";

export const dynamic = "force-dynamic";

export default async function EnvelopesPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/registro");
  const open = await getOpenEnvelopes();

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
      </div>
      <TeamBanner playerName={player.displayName} teamName={player.teamName} teamSlug={player.teamSlug} />
      <h1 className="title page-title center">
        Vuestros <span className="accent">sobres</span>
      </h1>
      <p className="center muted small">El organizador os dirá cuándo se abre cada uno.</p>

      <ul className="envelope-list">
        <li>
          <Link className="envelope-card envelope-card--open" href="/reglas">
            <WaxSeal tone="blood">
              <SkullCrossbones size={30} />
            </WaxSeal>
            <span>
              <span className="label">Antes de empezar</span>
              <b className="envelope-card__title">Reglas de la gincana</b>
            </span>
          </Link>
        </li>
        {ENVELOPES.map((e) =>
          open.has(e.number) ? (
            <li key={e.number}>
              <Link className="envelope-card envelope-card--open" href={`/sobres/${e.number}`}>
                <WaxSeal tone="gold">{e.number}</WaxSeal>
                <span>
                  <span className="label">Sobre {e.number} · abierto</span>
                  <b className="envelope-card__title">
                    <EnvelopeTitle envelope={e} />
                  </b>
                </span>
              </Link>
            </li>
          ) : (
            <li key={e.number}>
              <div className="envelope-card envelope-card--sealed" aria-label={`Sobre ${e.number}: sellado`}>
                <WaxSeal tone="blood">{e.number}</WaxSeal>
                <span>
                  <span className="label">Sobre {e.number}</span>
                  <b className="envelope-card__title">Sellado</b>
                </span>
              </div>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
