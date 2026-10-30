import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { TeamEmblem } from "@/components/ornaments";
import { TEAM_CODE_RE } from "@/lib/validation";
import { clearTeamCode, setTeamActive, setTeamCode } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamsAdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error: formError } = await searchParams;

  const supabase = db();
  const [teamsRes, playersRes] = await Promise.all([
    supabase.from("teams").select("id, name, slug, join_code, join_code_hash, locked_until, active")
      .order("sort_order")
      .order("created_at"),
    supabase.from("players").select("team_id").eq("active", true),
  ]);
  if (teamsRes.error) throw teamsRes.error;
  if (playersRes.error) throw playersRes.error;

  const playerCount = new Map<string, number>();
  for (const p of playersRes.data ?? []) playerCount.set(p.team_id, (playerCount.get(p.team_id) ?? 0) + 1);
  const now = new Date();
  const teams = teamsRes.data ?? [];

  /** Código visible; los puestos con una versión anterior solo tienen hash y no se pueden mostrar. */
  const codeLabel = (t: (typeof teams)[number]) =>
    t.join_code ?? (t.join_code_hash ? "(no visible: vuelve a escribirlo)" : null);

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Equipos</h1>
        <nav>
          <Link href="/admin">← Volver al panel</Link>
        </nav>
      </header>

      {formError && (
        <div className="alert alert--error" role="alert">
          <span>
            <b>Error:</b> {formError}
          </span>
        </div>
      )}

      <section className="panel">
        <p className="muted small" style={{ margin: 0 }}>
          Los equipos son fijos: los jugadores solo pueden elegir uno de esta lista. Si un equipo tiene código, hay que
          escribirlo para entrar (dáselo en su hoja). Sin código, cualquiera puede unirse a él eligiéndolo. Los códigos
          no distinguen mayúsculas. Un equipo desactivado desaparece del registro y sus jugadores dejan de poder
          registrar escaneos.
        </p>
      </section>

      <section className="panel" aria-labelledby="codes-title">
        <h2 id="codes-title">Códigos de un vistazo</h2>
        <div className="table-wrap">
          <table className="codes-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Jugadores</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td className="team">
                    <span className="team-heading">
                      <TeamEmblem name={t.name} slug={t.slug} size={24} /> {t.name}
                    </span>
                    {!t.active && <span className="tag tag--off">desactivado</span>}
                  </td>
                  <td>
                    {codeLabel(t) ? (
                      <code className="team-code">{codeLabel(t)}</code>
                    ) : (
                      <span className="code-state code-state--off">sin código</span>
                    )}
                  </td>
                  <td>{playerCount.get(t.id) ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {teams.map((t) => {
        const locked = t.locked_until && new Date(t.locked_until) > now;
        return (
          <section key={t.id} className="panel" aria-labelledby={`team-${t.id}`}>
            <h2 id={`team-${t.id}`}>
              <span className="team-heading">
                <TeamEmblem name={t.name} slug={t.slug} size={32} /> {t.name}
              </span>
              {!t.active && <span className="tag tag--off">desactivado</span>}
            </h2>
            <p className="small" style={{ margin: "4px 0 0" }}>
              {playerCount.get(t.id) ?? 0} jugadores ·{" "}
              {t.join_code_hash ? (
                <span className="code-state code-state--on">
                  Código: <code className="team-code">{codeLabel(t)}</code>
                </span>
              ) : (
                <span className="code-state code-state--off">Sin código: cualquiera puede unirse</span>
              )}
              {locked && <span className="tag tag--off">bloqueado por intentos fallidos</span>}
            </p>

            <form action={setTeamCode}>
              <input type="hidden" name="id" value={t.id} />
              <label htmlFor={`code-${t.id}`}>{t.join_code_hash ? "Editar código" : "Poner código"}</label>
              <input
                key={t.join_code ?? "none"}
                id={`code-${t.id}`}
                defaultValue={t.join_code ?? ""}
                name="code"
                inputMode="numeric"
                pattern="\d{4,8}"
                title="Solo cifras, de 4 a 8"
                minLength={4}
                maxLength={8}
                required
                autoComplete="off"
                placeholder="De 4 a 8 cifras"
              />
              {t.join_code && !TEAM_CODE_RE.test(t.join_code) && (
                <p className="small" style={{ color: "var(--pumpkin)", margin: "6px 0 0" }}>
                  Este código tiene letras: cámbialo por uno de cifras para que los jugadores vean el teclado numérico.
                </p>
              )}
              <button type="submit">Guardar código</button>
            </form>

            <div className="filters" style={{ marginBottom: 0 }}>
              {t.join_code_hash && (
                <form action={clearTeamCode}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="btn-ghost">Quitar código</button>
                </form>
              )}
              <form action={setTeamActive}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="active" value={t.active ? "false" : "true"} />
                <button type="submit" className="btn-ghost">
                  {t.active ? "Desactivar equipo" : "Activar equipo"}
                </button>
              </form>
            </div>
          </section>
        );
      })}
    </main>
  );
}
