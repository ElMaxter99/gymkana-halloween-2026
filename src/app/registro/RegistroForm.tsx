"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorAlert, SuccessSeal, TeamBanner } from "@/components/ui";
import { Divider, QrIcon, TeamEmblem, UsersIcon } from "@/components/ornaments";

export type TeamOption = {
  id: string;
  name: string;
  slug: string | null;
  requiresCode: boolean;
  /** El código es de cifras: se muestra el teclado numérico. */
  numericCode: boolean;
};
type Props = {
  teams: TeamOption[];
  next: string | null;
  current: { playerName: string; teamName: string; teamSlug?: string | null } | null;
};

type Mode = "new" | "existing";
type Teammate = { id: string; name: string };

export default function RegistroForm({ teams, next, current }: Props) {
  const router = useRouter();
  const [identity, setIdentity] = useState(current);
  const [justRegistered, setJustRegistered] = useState<null | "new" | "returning">(null);
  const [mode, setMode] = useState<Mode>("new");
  // «Ya me registré»: jugadores del equipo (tras comprobar el código) y el elegido
  const [teammates, setTeammates] = useState<Teammate[] | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = teams.find((t) => t.id === teamId);

  function validate(): { field: string; message: string } | null {
    if (mode === "new" && !playerName.trim()) return { field: "playerName", message: "Escribe tu nombre." };
    if (!selected) return { field: "teams", message: "Elige tu equipo." };
    if (selected.requiresCode && !joinCode.trim()) return { field: "joinCode", message: "Escribe el código de tu equipo." };
    if (mode === "existing" && teammates && !playerId) return { field: "teammates", message: "Toca tu nombre en la lista." };
    return null;
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setInvalid(null);
    setTeammates(null);
    setPlayerId("");
  }

  /** «Ya me registré», paso 1: con el equipo y su código, carga la lista de jugadores. */
  async function findTeammates() {
    setBusy(true);
    try {
      const res = await fetch("/api/register/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId, joinCode: selected?.requiresCode ? joinCode : "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Algo ha fallado. Inténtalo otra vez.");
        return;
      }
      setTeammates(data.players ?? []);
      setPlayerId("");
    } catch {
      setError("No hay conexión. Comprueba los datos móviles e inténtalo otra vez.");
    } finally {
      setBusy(false);
    }
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
      const target = problem.field === "teams" ? document.querySelector<HTMLInputElement>('input[name="team"]') : document.getElementById(problem.field);
      target?.focus();
      return;
    }

    if (mode === "existing" && !teammates) {
      await findTeammates();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          playerName,
          playerId,
          teamId,
          joinCode: selected?.requiresCode ? joinCode : "",
        }),
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
      setIdentity({ playerName: data.playerName, teamName: data.teamName, teamSlug: selected?.slug });
      setJustRegistered(data.returning ? "returning" : "new");
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
        <TeamBanner playerName={identity.playerName} teamName={identity.teamName} teamSlug={identity.teamSlug} />
        <section className="parchment">
          {justRegistered === "returning" ? (
            <SuccessSeal title="¡Bienvenido de nuevo!">
              Este móvil es ahora el tuyo: conservas tu historial. El móvil anterior ya no está identificado.
            </SuccessSeal>
          ) : justRegistered === "new" ? (
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
      <div className="tabs" role="group" aria-label="Cómo entras">
        <button type="button" aria-pressed={mode === "new"} onClick={() => switchMode("new")}>
          Soy nuevo
        </button>
        <button type="button" aria-pressed={mode === "existing"} onClick={() => switchMode("existing")}>
          Ya me registré
        </button>
      </div>

      {mode === "new" ? (
        <>
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
        </>
      ) : (
        <p className="hint" style={{ marginTop: 14 }}>
          ¿Te registraste en otro móvil (sin batería, otro navegador…)? Elige tu equipo y entra con tu nombre: conservas tus
          escaneos. El otro móvil dejará de estar identificado.
        </p>
      )}

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
                    setTeammates(null);
                    setPlayerId("");
                    if (invalid === "teams") setInvalid(null);
                  }}
                />
                <span className="team-option__card">
                  <span className="team-option__emblem"><TeamEmblem name={t.name} slug={t.slug} size={48} /></span>
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
            onChange={(e) => {
              setJoinCode(selected.numericCode ? e.target.value.replace(/\D/g, "").slice(0, 8) : e.target.value);
              setTeammates(null);
              setPlayerId("");
            }}
            {...(selected.numericCode
              ? { inputMode: "numeric" as const, pattern: "[0-9]*", maxLength: 8 }
              : { maxLength: 40, autoCapitalize: "none" })}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder={selected.numericCode ? "Código de cifras de vuestra hoja" : "Lo tenéis en la hoja de vuestro equipo"}
            {...fieldProps("joinCode")}
          />
        </>
      )}

      {mode === "existing" && teammates && (
        <fieldset className="teammates" aria-invalid={invalid === "teammates" ? true : undefined}>
          <legend>¿Quién eres?</legend>
          {teammates.length === 0 ? (
            <p className="empty">Todavía no hay nadie en este equipo: entra como «Soy nuevo».</p>
          ) : (
            <div className="teammates__list">
              {teammates.map((p) => (
                <label key={p.id} className="teammate">
                  <input
                    type="radio"
                    name="teammate"
                    value={p.id}
                    checked={playerId === p.id}
                    onChange={() => {
                      setPlayerId(p.id);
                      if (invalid === "teammates") setInvalid(null);
                    }}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && (
        <div id="form-error">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || teams.length === 0 || (mode === "existing" && teammates?.length === 0)}
        aria-busy={busy}
      >
        {busy
          ? "Sellando el pacto…"
          : mode === "existing"
            ? teammates
              ? playerId
                ? `Entrar como ${teammates.find((p) => p.id === playerId)?.name}`
                : "Toca tu nombre en la lista"
              : "Buscar mi nombre"
            : selected
              ? `Unirme al equipo ${selected.name}`
              : "Unirme al equipo"}
      </button>
    </form>
  );
}
