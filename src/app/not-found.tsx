import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page center">
      <div className="emoji-hero">💀</div>
      <h1>Aquí no hay nada…</h1>
      <p className="muted">Este QR no existe o ya no está activo.</p>
      <Link className="button secondary" href="/">Volver al inicio</Link>
    </main>
  );
}
