import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/player";
import { getOpenEnvelopes, getScannedQrPrefixes } from "@/lib/envelopes";
import { getEnvelope } from "@/content/sobres";
import EnvelopeView from "@/components/EnvelopeView";
import { GoldenRule, TeamBanner } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/ornaments";

export const dynamic = "force-dynamic";

export default async function EnvelopePage({ params }: { params: Promise<{ n: string }> }) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/registro");

  const envelope = getEnvelope(Number((await params).n));
  // Un sobre sellado no se puede leer aunque se conozca la URL.
  if (!envelope || !(await getOpenEnvelopes()).has(envelope.number)) redirect("/sobres");

  const scanned = envelope.map ? await getScannedQrPrefixes(player.teamId) : undefined;

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/sobres">
          <ArrowLeftIcon size={20} /> Sobres
        </Link>
      </div>
      <TeamBanner playerName={player.displayName} teamName={player.teamName} teamSlug={player.teamSlug} />
      <EnvelopeView envelope={envelope} teamName={player.teamName} teamSlug={player.teamSlug} scannedQr={scanned} />
      <GoldenRule />
    </main>
  );
}
