import Image, { type StaticImageData } from "next/image";
import {
  type Callout as CalloutData,
  type Envelope,
  LOCATIONS,
  ROUTES,
  personalize,
  teamKey,
} from "@/content/sobres";
import mapaCalabaza from "@/content/mapas/calabaza.webp";
import mapaFantasma from "@/content/mapas/fantasma.webp";
import mapaTodos from "@/content/mapas/todos.webp";
import { Callout } from "./ui";
import {
  AlertIcon,
  CheckIcon,
  Divider,
  FlameIcon,
  PentagramIcon,
  PinIcon,
  QrIcon,
  ScaleIcon,
  TargetIcon,
  TrophyIcon,
  WaxSeal,
} from "./ornaments";

/** Mapas con la ruta dibujada; los equipos sin hoja propia ven el mapa con todos los puntos. */
const MAPS: Record<string, StaticImageData> = { calabaza: mapaCalabaza, fantasma: mapaFantasma };

const CALLOUT_ICONS: Record<CalloutData["kind"], React.ReactNode> = {
  objetivo: <TargetIcon />,
  importante: <AlertIcon />,
  puntuacion: <TrophyIcon />,
  regla: <ScaleIcon />,
  especial: <PentagramIcon />,
  final: <FlameIcon />,
  bonus: <TrophyIcon />,
};

const CALLOUT_LABELS: Record<CalloutData["kind"], string> = {
  objetivo: "Objetivo",
  importante: "Importante",
  puntuacion: "Puntuación",
  regla: "Regla",
  especial: "Prueba especial",
  final: "Prueba final",
  bonus: "Bonus",
};

export function EnvelopeTitle({ envelope }: { envelope: Envelope }) {
  return (
    <>
      {envelope.title.map((part, i) => (
        <span key={i} className={part.tone ? `tone-${part.tone}` : undefined}>
          {part.text}
        </span>
      ))}
    </>
  );
}

/**
 * Un sobre tal como está en la hoja impresa, personalizado para el equipo.
 * scannedQr: prefijos de los QR que el equipo ya ha escaneado (para marcar el mapa).
 */
export default function EnvelopeView({
  envelope,
  teamName,
  scannedQr = new Set(),
}: {
  envelope: Envelope;
  teamName: string;
  scannedQr?: Set<string>;
}) {
  const t = (text: string) => personalize(text, teamName);

  return (
    <article className="parchment envelope">
      <p className="label envelope__number">Sobre {envelope.number}</p>
      <h1 className="envelope__title">
        <EnvelopeTitle envelope={envelope} />
      </h1>
      <Divider />
      <p className="envelope__tagline">{t(envelope.tagline)}</p>

      {envelope.banner && <p className="envelope__banner">{t(envelope.banner)}</p>}

      <Callout icon={<TargetIcon />} label="Objetivo">
        {t(envelope.objective)}
      </Callout>

      {envelope.sections.map((section, i) => (
        <section key={i} className="envelope__section">
          {section.heading && <h2 className="envelope__heading">{section.heading}:</h2>}
          <ul className="check-list">
            {section.items.map((item, j) => (
              <li key={j}>{t(item)}</li>
            ))}
          </ul>
        </section>
      ))}

      {envelope.map && <TeamRoute teamName={teamName} scannedQr={scannedQr} />}

      {envelope.callouts.map((c, i) =>
        c.kind === "final" ? (
          <div key={i} className="final-band">
            <FlameIcon size={34} />
            <p>
              <b>{c.label ?? CALLOUT_LABELS[c.kind]}:</b> {t(c.text)}
            </p>
          </div>
        ) : (
          <Callout
            key={i}
            icon={CALLOUT_ICONS[c.kind]}
            label={c.label ?? CALLOUT_LABELS[c.kind]}
            tone={c.kind === "puntuacion" || c.kind === "bonus" ? "pumpkin" : "blood"}
          >
            {t(c.text)}
          </Callout>
        ),
      )}
    </article>
  );
}

function TeamRoute({ teamName, scannedQr }: { teamName: string; scannedQr: Set<string> }) {
  const key = teamKey(teamName);
  const route = ROUTES[key];
  const map = MAPS[key] ?? mapaTodos;

  return (
    <section className="envelope__section">
      <div className="map-frame">
        <Image
          src={map}
          alt={MAPS[key] ? `Mapa con la ruta del equipo ${teamName}` : "Mapa del parque con todos los puntos"}
          sizes="(max-width: 480px) 100vw, 448px"
          placeholder="blur"
        />
      </div>

      {route ? (
        <>
          <ol className="locations">
            {route.map((locKey, i) => {
              const loc = LOCATIONS[locKey];
              const qr = typeof loc.proof === "object" ? loc.proof.qr : null;
              const done = qr ? scannedQr.has(qr) : false;
              return (
                <li key={locKey} className="location">
                  <WaxSeal tone={done ? "gold" : "blood"}>{done ? <CheckIcon /> : i + 1}</WaxSeal>
                  <div>
                    <h3>
                      <PinIcon size={18} /> Localización {i + 1} – {loc.name}
                    </h3>
                    <p>{loc.task}</p>
                    <p className="location__proof">
                      {qr ? (
                        <>
                          <QrIcon size={18} /> {done ? "QR escaneado ✓" : "→ Escanear QR"}
                        </>
                      ) : (
                        "→ Foto"
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="route-summary">
            <b>Vuestra ruta:</b> Casa (salida) → {route.map((k) => LOCATIONS[k].name).join(" → ")} → Casa (meta)
          </p>
        </>
      ) : (
        <p className="empty">Vuestra ruta aún no está en la web: seguid la hoja de vuestro sobre.</p>
      )}
    </section>
  );
}
