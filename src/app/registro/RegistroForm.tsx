"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorAlert, SuccessSeal, TeamBanner } from "@/components/ui";
import { Divider, QrIcon, UsersIcon } from "@/components/ornaments";

type Team = { id: string; name: string };
type Mode = "join" | "create";
type Props = {
  teams: Team[];
  next: string | null;
  initialMode: Mode;
  current: { playerName: string; teamName: string } | null;
};

export default function RegistroForm({ teams, next, initialMode, current }: Props) {
  const router = useRouter();
  const [identity, setIdentity] = useState(current);
  const [justRegistered, setJustRegistered] = useState<null | { created: boolean }>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInvalid(null);
  }

  function validate(): { field: string; message: string } | null {
    if (!playerName.trim()) return { field: "playerName", message: "Escribe tu nombre." };
    if (mode === "create" && teamName.trim().length < 2)
      return { field: "teamName", message: "El nombre del equipo debe tener al menos 2 caracteres." };
    if (mode === "join" && !teamId) return { field: "teamId", message: "Elige tu equipo de la lista." };
    if (joinCode.trim().length < 4)
      return { field: "joinCode", message: "El código del equipo debe tener al menos 4 caracteres." };
    return null;
  }

  async function leave() {
    setBusy(true);
    try {
      await fetch("/api/leave", { method: "POST" });
      setIdentity(null);
      setJustRegistered(null);
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
      document.getElementById(problem.field)?.focus();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, playerName, teamName, teamId, joinCode }),
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
      setJustRegistered({ created: Boolean(data.created) });
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
            <SuccessSeal title={justRegistered.created ? "¡Equipo creado!" : "¡Ya estás dentro!"}>
              {justRegistered.created
                ? "Comparte el código con tus compañeros para que se unan desde su móvil."
                : "Tu móvil ya está vinculado a tu equipo."}
            </SuccessSeal>
          ) : (
            <SuccessSeal title="Este móvil ya está registrado">
              No hace falta registrarse otra vez.
            </SuccessSeal>
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
      <div className="tabs" role="group" aria-label="Tipo de registro">
        <button type="button" aria-pressed={mode === "join"} onClick={() => switchMode("join")}>
          Unirme a un equipo
        </button>
        <button type="button" aria-pressed={mode === "create"} onClick={() => switchMode("create")}>
          Crear equipo
        </button>
      </div>

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

      {mode === "create" ? (
        <>
          <label htmlFor="teamName">Nombre del equipo</label>
          <input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Ej. Los Lobos"
            {...fieldProps("teamName")}
          />
          <label htmlFor="joinCode">Inventa un código secreto</label>
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
            placeholder="Mínimo 4 caracteres"
            {...fieldProps("joinCode")}
          />
          <span className="hint">Díselo solo a tus compañeros: lo necesitarán para unirse desde su móvil.</span>
        </>
      ) : teams.length === 0 ? (
        <p className="empty" style={{ marginTop: 16 }}>
          Todavía no hay equipos. Pulsa «Crear equipo» para fundar el tuyo.
        </p>
      ) : (
        <>
          <label htmlFor="teamId">Tu equipo</label>
          <select id="teamId" value={teamId} onChange={(e) => setTeamId(e.target.value)} {...fieldProps("teamId")}>
            <option value="" disabled>
              Elige tu equipo…
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <label htmlFor="joinCode">Código del equipo</label>
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
            placeholder="Pídeselo a quien creó el equipo"
            {...fieldProps("joinCode")}
          />
        </>
      )}

      {error && (
        <div id="form-error">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}

      <button type="submit" disabled={busy || (mode === "join" && teams.length === 0)} aria-busy={busy}>
        {busy ? "Sellando el pacto…" : mode === "create" ? "Crear equipo y entrar" : "Unirme al equipo"}
      </button>
    </form>
  );
}
