import Link from "next/link";
import { getCurrentPlayer } from "@/lib/player";
import { GoldenRule, TeamBanner } from "@/components/ui";
import {
  Bat,
  Candle,
  Compass,
  Divider,
  EnvelopeIcon,
  HauntedScene,
  KeyIcon,
  Pumpkin,
  QrIcon,
  SkullCrossbones,
  UsersIcon,
  WaxSeal,
  WebCorner,
} from "@/components/ornaments";

export const dynamic = "force-dynamic";

export default async function Home() {
  const player = await getCurrentPlayer();

  return (
    <main className="page">
      <section className="hero">
        <WebCorner className="hero__web" size={110} />
        <div className="poster">
          <p className="label poster__kicker">Se busca valor · 31 de octubre</p>
          <Pumpkin size={64} />
          <h1 className="poster__title">
            Gymkana <span>Halloween <em>2026</em></span>
          </h1>
          <span className="ribbon">La web que da vida a tu aventura</span>
        </div>
        <Bat className="flutter" size={54} />
        <p className="narrative">La noche ha comenzado. ¿Estás preparado para descubrir sus secretos?</p>
      </section>

      {player ? (
        <>
          <TeamBanner playerName={player.displayName} teamName={player.teamName} />
          <div className="button-row">
            <Link className="button btn-seal" href="/equipo">
              <UsersIcon /> Ver mi equipo
            </Link>
            <Link className="button btn-wood" href="/reglas">
              <SkullCrossbones size={26} /> Reglas de la gincana
            </Link>
          </div>
        </>
      ) : (
        <div className="button-row">
          <Link className="button btn-seal" href="/registro">
            <KeyIcon /> Unirme a mi equipo
          </Link>
          <Link className="button btn-wood" href="/reglas">
            <SkullCrossbones size={26} /> Reglas de la gincana
          </Link>
        </div>
      )}

      <section className="parchment" id="como-jugar" aria-labelledby="como-jugar-title">
        <h2 id="como-jugar-title">Cómo se juega</h2>
        <Divider />
        <ol className="steps">
          <li>
            <WaxSeal><UsersIcon /></WaxSeal>
            <span><b>Únete a tu equipo</b>Calabaza, Fantasma, Bruja o Zombie: elige el tuyo desde tu móvil (y escribe su código si os lo han dado).</span>
          </li>
          <li>
            <WaxSeal><Compass size={30} /></WaxSeal>
            <span><b>Abrid los sobres en orden</b>La gincana se juega en papel: cada sobre trae sus retos y su puntuación.</span>
          </li>
          <li>
            <WaxSeal><QrIcon /></WaxSeal>
            <span><b>Encuentra los QR escondidos</b>Escanéalos con la cámara: verás la prueba y quedará anotado quién la ha encontrado.</span>
          </li>
          <li>
            <WaxSeal><EnvelopeIcon /></WaxSeal>
            <span><b>Envía las pruebas por WhatsApp</b>Fotos y vídeos van al organizador, que es quien las valida y da los puntos.</span>
          </li>
        </ol>
      </section>

      <GoldenRule />

      <div className="center" aria-hidden="true">
        <Candle size={30} />
      </div>
      <HauntedScene className="scene" />
      <Link className="organizer-link" href="/admin" prefetch={false}>
        Acceso del organizador
      </Link>
    </main>
  );
}
