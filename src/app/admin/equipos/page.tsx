import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { TeamEmblem } from "@/components/ornaments";
import { clearTeamCode, setTeamActive, setTeamCode } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamsAdminPage() {
  await requireAdmin();

  const supabase = db();
  const [teamsRes, playersRes] = await Promise.all([
    supabase.from("teams").select("id, name, join_code_hash, locked_until, active").order("created_at"),
    supabase.from("players").select("team_id").eq("active", true),
  ]);
  if (teamsRes.error) throw teamsRes.error;
  if (playersRes.error) throw playersRes.error;

  const playerCount = new Map<string, number>();
  for (const p of playersRes.data ?? []) playerCount.set(p.team_id, (playerCount.get(p.team_id) ?? 0) + 1);
  const now = new Date();

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Equipos</h1>
        <nav>
          <Link href="/admin">← Volver al panel</Link>
        </nav>
      </header>

      <section className="panel">
        <p className="muted small" style={{ margin: 0 }}>
          Los equipos son fijos: los jugadores solo pueden elegir uno de esta lista. Si un equipo tiene código, hay que
          escribirlo para entrar (dáselo en su hoja). Sin código, cualquiera puede unirse a él eligiéndolo. Los códigos
          se guardan cifrados: si se te olvida uno, pon otro nuevo. Un equipo desactivado desaparece del registro y sus
          jugadores dejan de poder registrar escaneos.
        </p>
      </section>

      {(teamsRes.data ?? []).map((t) => {
        const locked = t.locked_until && new Date(t.locked_until) > now;
        return (
          <section key={t.id} className="panel" aria-labelledby={`team-${t.id}`}>
            <h2 id={`team-${t.id}`}>
              <span className="team-heading">
                <TeamEmblem name={t.name} size={32} /> {t.name}
              </span>
              {!t.active && <span className="tag tag--off">desactivado</span>}
            </h2>
            <p className="small" style={{ margin: "4px 0 0" }}>
              {playerCount.get(t.id) ?? 0} jugadores ·{" "}
              {t.join_code_hash ? (
                <span className="code-state code-state--on">Con código</span>
              ) : (
                <span className="code-state code-state--off">Sin código: cualquiera puede unirse</span>
              )}
              {locked && <span className="tag tag--off">bloqueado por intentos fallidos</span>}
            </p>

            <form action={setTeamCode}>
              <input type="hidden" name="id" value={t.id} />
              <label htmlFor={`code-${t.id}`}>{t.join_code_hash ? "Cambiar código" : "Poner código"}</label>
              <input
                id={`code-${t.id}`}
                name="code"
                minLength={4}
                maxLength={40}
                required
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Mínimo 4 caracteres"
              />
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
