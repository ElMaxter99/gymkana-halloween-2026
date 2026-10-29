"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string };
type Props = {
  teams: Team[];
  next: string | null;
  current: { playerName: string; teamName: string } | null;
};

export default function RegistroForm({ teams, next, current }: Props) {
  const router = useRouter();
  const [identity, setIdentity] = useState(current);
  const [mode, setMode] = useState<"join" | "create">(teams.length ? "join" : "create");
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function leave() {
    setBusy(true);
    await fetch("/api/leave", { method: "POST" });
    setIdentity(null);
    setBusy(false);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      } else {
        setIdentity({ playerName: data.playerName, teamName: data.teamName });
        router.refresh();
      }
    } catch {
      setError("Sin conexión. Comprueba los datos móviles e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
  }

  if (identity) {
    return (
      <>
        <div className="team-banner">
          Eres <b>{identity.playerName}</b> del equipo
          <strong>{identity.teamName}</strong>
        </div>
        <div className="card">
          <p className="ok">✔ Registro completado.</p>
          <p>Guarda el móvil: cuando encontréis un QR, escanéalo y quedará registrado a tu nombre.</p>
          {next && (
            <a className="button" href={next}>Ver el QR que habéis encontrado</a>
          )}
          <button className="secondary" onClick={leave} disabled={busy}>
            No soy yo / cambiar de equipo
          </button>
        </div>
      </>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="tabs" role="group" aria-label="Tipo de registro">
        <button type="button" aria-pressed={mode === "join"} onClick={() => setMode("join")}>
          Unirme a un equipo
        </button>
        <button type="button" aria-pressed={mode === "create"} onClick={() => setMode("create")}>
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
        placeholder="Álvaro"
        required
      />

      {mode === "create" ? (
        <>
          <label htmlFor="teamName">Nombre del equipo</label>
          <input
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={40}
            placeholder="Los Vampiros"
            required
          />
          <label htmlFor="joinCode">Inventa un código para tu equipo</label>
          <input
            id="joinCode"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={40}
            minLength={4}
            autoComplete="off"
            placeholder="Mínimo 4 caracteres"
            required
          />
          <p className="muted small">Díselo a tus compañeros para que se unan a tu equipo desde sus móviles.</p>
        </>
      ) : teams.length === 0 ? (
        <p className="muted">Todavía no hay equipos. Crea el tuyo.</p>
      ) : (
        <>
          <label htmlFor="teamId">Equipo</label>
          <select id="teamId" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
            <option value="" disabled>Elige tu equipo…</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <label htmlFor="joinCodeJoin">Código del equipo</label>
          <input
            id="joinCodeJoin"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={40}
            autoComplete="off"
            placeholder="Pídeselo a quien creó el equipo"
            required
          />
        </>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      <button type="submit" disabled={busy || (mode === "join" && teams.length === 0)}>
        {busy ? "Un momento…" : mode === "create" ? "Crear equipo y entrar" : "Unirme al equipo"}
      </button>
    </form>
  );
}
