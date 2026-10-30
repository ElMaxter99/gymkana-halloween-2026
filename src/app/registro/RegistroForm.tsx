"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorAlert, SuccessSeal, TeamBanner } from "@/components/ui";
import { Divider, QrIcon, TeamEmblem, UsersIcon } from "@/components/ornaments";

export type TeamOption = { id: string; name: string; requiresCode: boolean };
type Props = {
  teams: TeamOption[];
  next: string | null;
  current: { playerName: string; teamName: string } | null;
};

export default function RegistroForm({ teams, next, current }: Props) {
  const router = useRouter();
  const [identity, setIdentity] = useState(current);
  const [justRegistered, setJustRegistered] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = teams.find((t) => t.id === teamId);

  function validate(): { field: string; message: string } | null {
    if (!playerName.trim()) return { field: "playerName", message: "Escribe tu nombre." };
    if (!selected) return { field: "teams", message: "Elige tu equipo." };
    if (selected.requiresCode && !joinCode.trim()) return { field: "joinCode", message: "Escribe el código de tu equipo." };
    return null;
  }

  async function leave() {
    setBusy(true);
    try {
      await fetch("/api/leave", { method: "POST" });
      setIdentity(null);
      setJustRegistered(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = validate();
    setInvalid(problem?.field ?? null);
    setError(problem?.message ?? null);
    if (problem) {
      const target = problem.field === "teams" ? document.querySelector<HTMLInputElement>('input[name="team"]') : document.getElementById(problem.field);
      target?.focus();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerName, teamId, joinCode: selected?.requiresCode ? joinCode : "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Algo ha fallado. Inténtalo otra vez.");
        return;
      }
      if (next) {
        router.replace(next);
        return;
      }
      setIdentity({ playerName: data.playerName, teamName: data.teamName });
      setJustRegistered(true);
      router.refresh();
    } catch {
      setError("No hay conexión. Comprueba los datos móviles e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  if (identity) {
    return (
      <>
        <TeamBanner playerName={identity.playerName} teamName={identity.teamName} />
        <section className="parchment">
          {justRegistered ? (
            <SuccessSeal title="¡Ya estás dentro!">Tu móvil ya está vinculado a tu equipo.</SuccessSeal>
          ) : (
            <SuccessSeal title="Este móvil ya está registrado">No hace falta registrarse otra vez.</SuccessSeal>
          )}
          <Divider />
          <p>Cuando encontréis un QR, escanéalo con la cámara: quedará anotado a tu nombre y al de tu equipo.</p>
          {next && (
            <a className="button btn-seal" href={next}>
              <QrIcon /> Ver el QR que habéis encontrado
            </a>
          )}
          <Link className="button btn-wood" href="/equipo">
            <UsersIcon /> Ver mi equipo
          </Link>
          <button type="button" className="btn-ghost" onClick={leave} disabled={busy}>
            No soy yo / cambiar de equipo
          </button>
        </section>
      </>
    );
  }

  const fieldProps = (name: string) => ({
    "aria-invalid": invalid === name ? (true as const) : undefined,
    "aria-describedby": invalid === name ? "form-error" : undefined,
  });

  return (
    <form className="parchment" onSubmit={submit} noValidate>
      <label htmlFor="playerName">Tu nombre</label>
      <input
        id="playerName"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        maxLength={40}
        autoComplete="given-name"
        autoCapitalize="words"
        enterKeyHint="next"
        placeholder="Ej. Álvaro"
        {...fieldProps("playerName")}
      />

      <fieldset className="team-picker" aria-invalid={invalid === "teams" ? true : undefined}>
        <legend>Tu equipo</legend>
        {teams.length === 0 ? (
          <p className="empty">Todavía no hay equipos disponibles. Avisa al organizador.</p>
        ) : (
          <div className="team-picker__grid">
            {teams.map((t) => (
              <label key={t.id} className="team-option">
                <input
                  type="radio"
                  name="team"
                  value={t.id}
                  checked={teamId === t.id}
                  onChange={() => {
                    setTeamId(t.id);
                    setJoinCode("");
                    if (invalid === "teams") setInvalid(null);
                  }}
                />
                <span className="team-option__card">
                  <span className="team-option__emblem"><TeamEmblem name={t.name} size={48} /></span>
                  <span className="team-option__name">{t.name}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {selected?.requiresCode && (
        <>
          <label htmlFor="joinCode">Código del equipo {selected.name}</label>
          <input
            id="joinCode"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="Lo tenéis en la hoja de vuestro equipo"
            {...fieldProps("joinCode")}
          />
        </>
      )}

      {error && (
        <div id="form-error">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}

      <button type="submit" disabled={busy || teams.length === 0} aria-busy={busy}>
        {busy ? "Sellando el pacto…" : selected ? `Unirme al equipo ${selected.name}` : "Unirme al equipo"}
      </button>
    </form>
  );
}
