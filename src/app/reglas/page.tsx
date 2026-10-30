import Link from "next/link";
import type { Metadata } from "next";
import { Callout, GoldenRule } from "@/components/ui";
import { ArrowLeftIcon, Candle, Compass, Divider, MapIcon, SkullCrossbones, TrophyIcon } from "@/components/ornaments";

export const metadata: Metadata = { title: "Reglas · Gymkana Halloween 2026" };

// Texto de la hoja «Reglas de la gincana» que va en el sobre de cada equipo.
const RULES: React.ReactNode[] = [
  <>El equipo debe permanecer <strong>SIEMPRE</strong> unido.</>,
  <>Todas las pruebas deben demostrarse mediante <strong>FOTO</strong> o <strong>VÍDEO</strong>.</>,
  <>No vale hacer trampas ni reutilizar una misma prueba si no se indica expresamente.</>,
  <>Está prohibido entrar en propiedades privadas o coger objetos sin permiso.</>,
  <>Si una prueba requiere la participación de una persona externa, esa persona debe aceptar voluntariamente.</>,
  <>No vale comprar los objetos de las pruebas de «caza del tesoro», salvo que la prueba indique lo contrario.</>,
  <>En la prueba «La casa maldita», si una puerta está cerrada no se puede abrir.</>,
  <>El organizador tiene la última palabra en caso de duda.</>,
  <>La creatividad puede ser recompensada con puntos extra.</>,
];

export default function RulesPage() {
  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
      </div>

      <article className="parchment">
        <div className="heading-icons">
          <SkullCrossbones size={30} />
          <h1 className="title center" style={{ color: "var(--ink)", fontSize: "clamp(1.3rem, 6.4vw, 1.9rem)", lineHeight: 1.1 }}>
            Reglas <span className="accent">de la</span> gincana
          </h1>
          <SkullCrossbones size={30} />
        </div>
        <Divider />
        <p className="center" style={{ fontWeight: 700, fontSize: "1.1rem", margin: "0 0 12px" }}>
          Bienvenidos a la noche en la que la amistad, el alcohol y el sentido común serán puestos a prueba.
        </p>
        <ol className="rules">
          {RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
        <div className="center" aria-hidden="true">
          <Candle size={26} />
        </div>
      </article>

      <Callout icon={<Compass size={30} />} label="Objetivo">
        Completar el máximo número de pruebas y conseguir más puntos que los demás equipos.
      </Callout>

      <GoldenRule />

      <Callout icon={<TrophyIcon />} label="Victoria" tone="pumpkin">
        Gana el equipo que consiga más puntos al finalizar la gincana.
      </Callout>

      <Link className="button btn-wood" href="/#como-jugar">
        <MapIcon /> Cómo funciona la web
      </Link>
    </main>
  );
}
