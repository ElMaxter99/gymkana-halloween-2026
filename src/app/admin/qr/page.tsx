import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { createPoint, updatePoint } from "./actions";

export const dynamic = "force-dynamic";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function qr(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 480, errorCorrectionLevel: "M" });
}

export default async function QrAdminPage() {
  await requireAdmin();
  const base = await baseUrl();

  const { data: points, error } = await db()
    .from("qr_points")
    .select("id, slug, title, instructions, sort_order, active")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;

  const registroUrl = `${base}/registro`;
  const cards = await Promise.all([
    { key: "registro", title: "📝 Registro de equipos", url: registroUrl, active: true },
    ...(points ?? []).map((p) => ({ key: p.id, title: p.title, url: `${base}/p/${p.slug}`, active: p.active })),
  ].map(async (c) => ({ ...c, image: await qr(c.url) })));

  return (
    <main className="page-wide admin">
      <header className="admin-header no-print">
        <h1>Puntos QR</h1>
        <nav><Link href="/admin">← Volver al panel</Link></nav>
      </header>

      <section className="panel no-print">
        <h2>Nuevo punto QR</h2>
        <form action={createPoint}>
          <label htmlFor="new-title">Título</label>
          <input id="new-title" name="title" maxLength={80} required placeholder="La cripta" />
          <label htmlFor="new-instructions">Instrucciones que verán al escanear</label>
          <textarea id="new-instructions" name="instructions" maxLength={4000} />
          <label htmlFor="new-slug">Slug de la URL (opcional)</label>
          <input id="new-slug" name="slug" maxLength={64} placeholder="Vacío = se genera uno aleatorio" />
          <label htmlFor="new-order">Orden</label>
          <input id="new-order" name="sort_order" type="number" defaultValue={(points?.length ?? 0) + 1} />
          <button type="submit">Crear punto</button>
        </form>
      </section>

      <section className="panel no-print">
        <h2>Editar puntos</h2>
        {(points ?? []).map((p) => (
          <details key={p.id}>
            <summary>
              {p.title} {!p.active && <span className="tag tag--off">desactivado</span>}
              <span className="muted small"> — /p/{p.slug}</span>
            </summary>
            <form action={updatePoint}>
              <input type="hidden" name="id" value={p.id} />
              <label htmlFor={`title-${p.id}`}>Título</label>
              <input id={`title-${p.id}`} name="title" defaultValue={p.title} maxLength={80} required />
              <label htmlFor={`instr-${p.id}`}>Instrucciones</label>
              <textarea id={`instr-${p.id}`} name="instructions" defaultValue={p.instructions} maxLength={4000} />
              <label htmlFor={`order-${p.id}`}>Orden</label>
              <input id={`order-${p.id}`} name="sort_order" type="number" defaultValue={p.sort_order} />
              <label>
                <input type="checkbox" name="active" defaultChecked={p.active} />
                Activo
              </label>
              <p className="muted small">El slug no se puede cambiar para no invalidar QR ya impresos.</p>
              <button type="submit">Guardar</button>
            </form>
          </details>
        ))}
      </section>

      <section className="panel no-print">
        <h2>QR para imprimir</h2>
        <p className="muted small">
          Usa «Imprimir» del navegador: solo se imprimen las tarjetas. Comprueba antes que la URL es la del dominio
          definitivo. Los QR desactivados no aparecen.
        </p>
      </section>
      <div className="qr-grid">
        {cards.filter((c) => c.active).map((c) => (
          <div key={c.key} className="qr-card">
            <h2>{c.title}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image} alt={`QR de ${c.title}`} />
            <div className="url">{c.url}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
