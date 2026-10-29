"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page center">
      <div className="emoji-hero">🧟</div>
      <h1>Algo ha fallado</h1>
      <p className="muted">Puede ser la conexión. Inténtalo de nuevo en unos segundos.</p>
      <button onClick={reset}>Reintentar</button>
    </main>
  );
}
