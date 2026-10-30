"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
/** Cliente con la clave pública: solo escucha el canal de avisos (no puede leer ninguna tabla). */
function realtimeClient(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  client ??= createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export type ChannelState = "connecting" | "live" | "reconnecting" | "unavailable";

/**
 * Escucha los avisos de cambio del marcador (Supabase Realtime, canal «marcador»).
 * Llama a onVersion(v) con cada versión nueva. Supabase reconecta solo; mientras tanto el estado
 * pasa a «reconnecting» y las pantallas tiran de su sondeo de respaldo.
 */
export function useScoreChannel(onVersion: (version: number) => void): ChannelState {
  const [state, setState] = useState<ChannelState>(() => (realtimeClient() ? "connecting" : "unavailable"));
  const callback = useRef(onVersion);
  callback.current = onVersion;

  useEffect(() => {
    const supabase = realtimeClient();
    if (!supabase) return;
    const channel = supabase
      .channel("marcador")
      .on("broadcast", { event: "cambio" }, ({ payload }) => {
        const v = Number((payload as { v?: unknown })?.v);
        if (Number.isFinite(v)) callback.current(v);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setState("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setState("reconnecting");
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return state;
}
