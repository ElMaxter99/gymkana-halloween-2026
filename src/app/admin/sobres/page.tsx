import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getOpenEnvelopes } from "@/lib/envelopes";
import { formatTime } from "@/lib/format";
import { ENVELOPES } from "@/content/sobres";
import { EnvelopeTitle } from "@/components/EnvelopeView";
import { setEnvelopeOpen } from "./actions";

export const dynamic = "force-dynamic";

export default async function EnvelopesAdminPage() {
  await requireAdmin();
  const open = await getOpenEnvelopes();

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Sobres</h1>
        <nav>
          <Link href="/admin">← Volver al panel</Link>
        </nav>
      </header>

      <section className="panel">
        <p className="muted small" style={{ margin: 0 }}>
          Los jugadores ven en <b>/sobres</b> los sobres que abras aquí; los demás aparecen sellados y no se pueden leer
          aunque se conozca la URL. «Nueva partida» vuelve a sellarlos todos. Las reglas siempre están visibles. El
          contenido está en <code>src/content/sobres.ts</code>.
        </p>
      </section>

      {ENVELOPES.map((e) => {
        const openedAt = open.get(e.number);
        return (
          <section key={e.number} className="panel envelope-admin">
            <div>
              <span className="label">Sobre {e.number}</span>
              <h2>
                <EnvelopeTitle envelope={e} />
              </h2>
              <p className="small" style={{ margin: "2px 0 0" }}>
                {openedAt ? (
                  <span className="code-state code-state--on">Abierto desde las {formatTime(openedAt)}</span>
                ) : (
                  <span className="code-state code-state--off">Sellado</span>
                )}{" "}
                · <Link href={`/admin/sobres/${e.number}`}>Ver como un equipo</Link>
              </p>
            </div>
            <form action={setEnvelopeOpen}>
              <input type="hidden" name="envelope" value={e.number} />
              <input type="hidden" name="open" value={openedAt ? "false" : "true"} />
              <button type="submit" className={openedAt ? "btn-ghost" : undefined}>
                {openedAt ? "Volver a sellar" : `Abrir sobre ${e.number}`}
              </button>
            </form>
          </section>
        );
      })}
    </main>
  );
}
