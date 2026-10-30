"use client";

import { Divider } from "@/components/ornaments";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <section className="parchment center" style={{ marginTop: 40 }}>
        <h1 className="title" style={{ fontSize: "2.2rem", color: "var(--blood)" }}>
          Algo ha fallado
        </h1>
        <Divider />
        <p>Puede que se haya cortado la conexión. Espera unos segundos e inténtalo de nuevo.</p>
        <button type="button" className="btn-seal" onClick={reset}>
          Reintentar
        </button>
      </section>
    </main>
  );
}
