import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminName, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import { notifyScoreChange } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  task: "Prueba",
  award: "Bonus",
  extra: "Extra",
  undo: "Deshacer",
  reset: "Reinicio",
  config: "Configuración",
  qr: "QR",
};

async function undo(form: FormData) {
  "use server";
  await requireAdmin();
  const id = Number(form.get("id"));
  const { data, error } =
    form.get("last") === "1"
      ? await db().rpc("score_undo_last", { p_actor: await getAdminName() })
      : await db().rpc("score_undo", { p_log_id: id, p_actor: await getAdminName() });
  if (error) redirect(`/admin/puntos/historial?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/puntos", "layout");
  after(() => notifyScoreChange(data as number));
  redirect("/admin/puntos/historial?hecho=1");
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ error?: string; hecho?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const { data: rows, error } = await db()
    .from("score_log")
    .select("id, at, actor, action, summary, undone")
    .order("id", { ascending: false })
    .limit(300);
  if (error) throw error;

  return (
    <main className="page-wide admin">
      <header className="admin-header">
        <h1>Historial del marcador</h1>
        <nav>
          <Link href="/admin/puntos">← Puntuar</Link>
        </nav>
      </header>

      {params.error && (
        <div className="alert alert--error" role="alert">
          <span>
            <b>No se pudo deshacer:</b> {params.error}
          </span>
        </div>
      )}
      {params.hecho && (
        <div className="alert alert--ok" role="status">
          <span>Acción deshecha.</span>
        </div>
      )}

      <section className="panel">
        <form action={undo}>
          <input type="hidden" name="last" value="1" />
          <button type="submit" className="btn-wood">
            ↶ Deshacer la última acción
          </button>
        </form>
        <p className="muted small">
          Se pueden deshacer pruebas, bonus y extras. Si la misma prueba se cambió después, deshaz primero el cambio más
          reciente. Lo anterior a un reinicio o a una partida nueva ya no se puede deshacer.
        </p>
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table className="stack-table">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Quién</th>
                <th>Tipo</th>
                <th>Qué</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Todavía no hay cambios.
                  </td>
                </tr>
              )}
              {(rows ?? []).map((r) => (
                <tr key={r.id} className={r.undone ? "is-undone" : undefined}>
                  <td className="time" data-label="Cuándo">
                    {formatDateTime(r.at)}
                  </td>
                  <td data-label="Quién">{r.actor}</td>
                  <td data-label="Tipo">{ACTION_LABEL[r.action] ?? r.action}</td>
                  <td data-label="Qué" className="wrap">
                    {r.summary}
                    {r.undone && <span className="tag tag--off">deshecho</span>}
                  </td>
                  <td data-label="">
                    {!r.undone && ["task", "award", "extra"].includes(r.action) && (
                      <form action={undo}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="inline btn-ghost">
                          Deshacer
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
