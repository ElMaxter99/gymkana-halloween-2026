import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/supabase";
import { getScannedQrPrefixes } from "@/lib/envelopes";
import { getEnvelope } from "@/content/sobres";
import EnvelopeView from "@/components/EnvelopeView";

export const dynamic = "force-dynamic";

/** Vista previa de un sobre tal como lo ve un equipo (aunque esté sellado). */
export default async function EnvelopePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string }>;
  searchParams: Promise<{ equipo?: string }>;
}) {
  await requireAdmin();
  const envelope = getEnvelope(Number((await params).n));
  if (!envelope) notFound();

  const { data: teams, error } = await db()
    .from("teams")
    .select("id, name, slug")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  const wanted = (await searchParams).equipo;
  const team = (teams ?? []).find((t) => t.id === wanted) ?? teams?.[0];
  if (!team) notFound();
  const scanned = envelope.map ? await getScannedQrPrefixes(team.id) : undefined;

  return (
    <main className="page admin">
      <div className="topbar">
        <Link className="back-link" href="/admin/sobres">
          ← Sobres
        </Link>
      </div>
      <nav className="team-switch" aria-label="Ver como el equipo">
        {(teams ?? []).map((t) => (
          <Link key={t.id} href={`/admin/sobres/${envelope.number}?equipo=${t.id}`} aria-current={t.id === team.id ? "page" : undefined}>
            {t.name}
          </Link>
        ))}
      </nav>
      <EnvelopeView envelope={envelope} teamName={team.name} teamSlug={team.slug} scannedQr={scanned} />
    </main>
  );
}
