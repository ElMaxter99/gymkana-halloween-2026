import Link from "next/link";
import { Divider, Skull } from "@/components/ornaments";

export default function NotFound() {
  return (
    <main className="page">
      <section className="parchment center" style={{ marginTop: 40 }}>
        <Skull size={72} />
        <h1 className="title" style={{ fontSize: "2.2rem", color: "var(--blood)" }}>
          Aquí no hay nada…
        </h1>
        <Divider />
        <p>Este código no existe o ya no está activo. Revisa que has escaneado el QR correcto o pregunta al organizador.</p>
        <Link className="button btn-wood" href="/">
          Volver a la portada
        </Link>
      </section>
    </main>
  );
}
