"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorAlert } from "@/components/ui";
import { ArrowLeftIcon, Candle, Divider } from "@/components/ornaments";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setError((await res.json().catch(() => ({}))).error ?? "No se pudo iniciar sesión.");
    } catch {
      setError("No hay conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="topbar">
        <Link className="back-link" href="/">
          <ArrowLeftIcon size={20} /> Portada
        </Link>
      </div>
      <form className="parchment" onSubmit={submit}>
        <div className="center">
          <Candle size={34} />
        </div>
        <h1 className="title center" style={{ fontSize: "2.2rem", color: "var(--blood)" }}>
          Acceso del organizador
        </h1>
        <Divider />
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <ErrorAlert>{error}</ErrorAlert>}
        <button type="submit" disabled={busy}>
          {busy ? "Abriendo el grimorio…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
