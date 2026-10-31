import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/player";
import { getEnvelopeStatuses } from "@/lib/envelopes";
import { formatDayAndTime, formatHourMinute } from "@/lib/format";
import RefreshAt from "@/components/RefreshAt";
import { ENVELOPES } from "@/content/sobres";
import { EnvelopeTitle } from "@/components/EnvelopeView";
import { TeamBanner } from "@/components/ui";
import { ArrowLeftIcon, SkullCrossbones, WaxSeal } from "@/components/ornaments";

export const dynamic = "force-dynamic";

export default async function EnvelopesPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/registro");
  const statuses = await getEnvelopeStatuses();
  const isOpen = (n: number) => Boolean(statuses.get(n)?.openedAt);
  const opensAt = (n: number) => (isOpen(n) ? null : (statuses.get(n)?.scheduledAt ?? null));
  // Próxima apertura programada: a esa hora la página se actualiza sola
  const nextOpening =
    ENVELOPES.map((e) => opensAt(e.number))
      .filter((t): t is string => Boolean(t))
      .sort()[0] ?? null;
  const when = (iso: string) =>
    new Date(iso).getTime() - Date.now() < 20 * 3600_000 ? `a las ${formatHourMinute(iso)}` : `el ${formatDayAndTime(iso)}`;

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
      <p className="center muted small">Los sobres se abren cuando lo diga el organizador o al llegar su hora.</p>
      <RefreshAt at={nextOpening} />

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
          isOpen(e.number) ? (
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
                  {opensAt(e.number) && <span className="envelope-card__when">⏰ Se abre {when(opensAt(e.number)!)}</span>}
                </span>
              </div>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
