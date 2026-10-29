import { AlertIcon, CheckIcon, WaxSeal } from "./ornaments";

/** «Eres X del equipo Y»: se muestra en todas las pantallas del jugador identificado. */
export function TeamBanner({ playerName, teamName }: { playerName: string; teamName: string }) {
  return (
    <div className="team-banner">
      <WaxSeal tone="blood">{teamName.trim().charAt(0).toUpperCase() || "?"}</WaxSeal>
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
