import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getEnvelopeStatuses } from "@/lib/envelopes";
import { TIMEZONE, formatDayAndTime, formatHourMinute } from "@/lib/format";
import { utcToLocalInput } from "@/lib/time";
import { ENVELOPES } from "@/content/sobres";
import { EnvelopeTitle } from "@/components/EnvelopeView";
import { clearEnvelopeSchedule, scheduleEnvelope, setEnvelopeOpen } from "./actions";

export const dynamic = "force-dynamic";

/** «dentro de 1 h 20 min» */
function timeUntil(iso: string): string {
  const min = Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
  if (min < 60) return `dentro de ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `dentro de ${h} h${m ? ` ${m} min` : ""}`;
}

export default async function EnvelopesAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const statuses = await getEnvelopeStatuses();

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Sobres</h1>
        <nav>
          <Link href="/admin">← Volver al panel</Link>
        </nav>
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>
            <b>Error:</b> {error}
          </span>
        </div>
      )}

      <section className="panel">
        <p className="muted small" style={{ margin: 0 }}>
          Los jugadores ven en <b>/sobres</b> los sobres abiertos; los demás aparecen sellados y no se pueden leer aunque se
          conozca la URL. Puedes abrirlos a mano o <b>programar la hora</b> a la que se abren solos (hora de {TIMEZONE}):
          a esa hora se abren en los móviles sin que tengas que hacer nada. «Volver a sellar» también quita la hora.
          «Nueva partida» sella todos y borra las horas que ya pasaron (conserva las futuras). Las reglas siempre están
          visibles. El contenido está en <code>src/content/sobres.ts</code>.
        </p>
      </section>

      {ENVELOPES.map((e) => {
        const st = statuses.get(e.number);
        const openedAt = st?.openedAt ?? null;
        const scheduledAt = st?.scheduledAt ?? null;
        const future = scheduledAt && !openedAt ? scheduledAt : null;
        return (
          <section key={e.number} id={`sobre-${e.number}`} className="panel envelope-admin">
            <div>
              <span className="label">Sobre {e.number}</span>
              <h2>
                <EnvelopeTitle envelope={e} />
              </h2>
              <p className="small" style={{ margin: "2px 0 0" }}>
                {openedAt ? (
                  <span className="code-state code-state--on">
                    {st?.manual ? "Abierto" : "Abierto automáticamente"} desde las {formatHourMinute(openedAt)}
                  </span>
                ) : future ? (
                  <span className="code-state envelope-admin__scheduled">
                    ⏰ Se abrirá solo el {formatDayAndTime(future)} ({timeUntil(future)})
                  </span>
                ) : (
                  <span className="code-state code-state--off">Sellado</span>
                )}{" "}
                · <Link href={`/admin/sobres/${e.number}`}>Ver como un equipo</Link>
              </p>
            </div>

            <div className="envelope-admin__actions">
              <form action={setEnvelopeOpen}>
                <input type="hidden" name="envelope" value={e.number} />
                <input type="hidden" name="open" value={openedAt ? "false" : "true"} />
                <button type="submit" className={openedAt ? "btn-ghost" : undefined}>
                  {openedAt ? "Volver a sellar" : `Abrir sobre ${e.number} ahora`}
                </button>
              </form>

              {!openedAt && (
                <form action={scheduleEnvelope} className="envelope-admin__schedule">
                  <input type="hidden" name="envelope" value={e.number} />
                  <label htmlFor={`open-at-${e.number}`}>Abrir automáticamente el</label>
                  <input
                    id={`open-at-${e.number}`}
                    name="open_at"
                    type="datetime-local"
                    required
                    defaultValue={future ? utcToLocalInput(future) : ""}
                    key={future ?? "none"}
                  />
                  <button type="submit" className="inline">
                    {future ? "Cambiar hora" : "Programar"}
                  </button>
                </form>
              )}
              {future && (
                <form action={clearEnvelopeSchedule}>
                  <input type="hidden" name="envelope" value={e.number} />
                  <button type="submit" className="inline btn-ghost">
                    Quitar la hora
                  </button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
