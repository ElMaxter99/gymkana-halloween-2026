"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicScoreboard } from "./scoreboard";
import { useScoreChannel, type ChannelState } from "./useScoreChannel";

export type LiveStatus = "live" | "polling" | "reconnecting" | "offline";

/** Marcador que se actualiza solo: aviso en tiempo real + sondeo de respaldo + reintento al volver la red. */
export function useLiveScoreboard(initial: PublicScoreboard) {
  const [data, setData] = useState(initial);
  const [online, setOnline] = useState(true);
  const version = useRef(initial.version);
  const busy = useRef(false);
  const again = useRef<number | null>(null);

  const load = useCallback(async (v?: number) => {
    if (busy.current) {
      again.current = Math.max(again.current ?? 0, v ?? 0);
      return;
    }
    busy.current = true;
    try {
      const res = await fetch(`/api/marcador${v ? `?v=${v}` : ""}`);
      if (!res.ok) throw new Error(String(res.status));
      const next: PublicScoreboard = await res.json();
      if (next.version >= version.current) {
        version.current = next.version;
        setData(next);
      }
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      busy.current = false;
      if (again.current !== null) {
        const pending = again.current;
        again.current = null;
        void load(pending || undefined);
      }
    }
  }, []);

  const channel: ChannelState = useScoreChannel((v) => {
    if (v > version.current) void load(v);
  });

  // Respaldo: con el canal en directo basta un repaso cada 20 s; sin él, cada 5 s.
  useEffect(() => {
    const ms = channel === "live" && online ? 20_000 : 5_000;
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, ms);
    return () => clearInterval(timer);
  }, [channel, online, load]);

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [load]);

  const status: LiveStatus = !online
    ? "offline"
    : channel === "live"
      ? "live"
      : channel === "unavailable"
        ? "polling"
        : "reconnecting";

  return { data, status };
}
