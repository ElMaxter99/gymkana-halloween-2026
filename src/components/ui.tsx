import { AlertIcon, CheckIcon, PentagramIcon, TeamEmblem, WaxSeal } from "./ornaments";

/** «Eres X del equipo Y»: se muestra en todas las pantallas del jugador identificado. */
export function TeamBanner({
  playerName,
  teamName,
  teamSlug,
}: {
  playerName: string;
  teamName: string;
  teamSlug?: string | null;
}) {
  return (
    <div className="team-banner">
      <WaxSeal tone="blood">
        <TeamEmblem name={teamName} slug={teamSlug} size={34} />
      </WaxSeal>
      <div>
        <span className="team-banner__who">
          <b>{playerName}</b>, perteneces al equipo
        </span>
        <strong className="team-banner__team">{teamName}</strong>
      </div>
    </div>
  );
}

export function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="alert alert--error" role="alert">
      <AlertIcon size={22} />
      <div>
        <b>Error:</b> {children}
      </div>
    </div>
  );
}

/** Sello dorado de confirmación. */
export function SuccessSeal({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="success" role="status">
      <WaxSeal tone="gold">
        <CheckIcon size={30} />
      </WaxSeal>
      <div>
        <b className="success__title">{title}</b>
        {children && <div className="success__body">{children}</div>}
      </div>
    </div>
  );
}

/** Caja con marco rojo e icono, como «OBJETIVO:» o «REGLA:» en las hojas impresas. */
export function Callout({
  icon,
  label,
  tone = "blood",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "blood" | "pumpkin";
  children: React.ReactNode;
}) {
  return (
    <div className={`callout callout--${tone}`}>
      <span className="callout__icon">{icon}</span>
      <p>
        <b className="callout__label">{label}:</b> {children}
      </p>
    </div>
  );
}

/** Banda roja de la regla de oro de la gymkana. */
export function GoldenRule() {
  return (
    <div className="golden-rule">
      <PentagramIcon size={40} />
      <p>
        <b>Regla de oro:</b> si no hay foto o vídeo… no ha pasado.
      </p>
    </div>
  );
}
