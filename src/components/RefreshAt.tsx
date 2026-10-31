"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir la página al servidor a una hora concreta (p. ej. la apertura programada de un sobre)
 * y, de respaldo, cada «everyMs». Así los sobres se abren solos en los móviles sin recargar.
 */
export default function RefreshAt({ at, everyMs = 60_000 }: { at: string | null; everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!at) return;
    // Un pelín después de la hora, por si el reloj del móvil va adelantado
    const delay = new Date(at).getTime() - Date.now() + 1500;
    if (delay > 2 ** 31 - 1) return; // más de ~24 días: lo recoge el respaldo
    const timer = setTimeout(() => router.refresh(), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [at, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, everyMs);
    const onVisible = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [everyMs, router]);

  return null;
}
