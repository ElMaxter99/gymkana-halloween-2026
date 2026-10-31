export const TIMEZONE = process.env.EVENT_TIMEZONE || "Europe/Madrid";

export function formatTime(iso: string, timeZone = TIMEZONE): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone = TIMEZONE): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

export function formatHourMinute(iso: string, timeZone = TIMEZONE): string {
  return new Intl.DateTimeFormat("es-ES", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** «31/10 a las 22:30» */
export function formatDayAndTime(iso: string, timeZone = TIMEZONE): string {
  const day = new Intl.DateTimeFormat("es-ES", { timeZone, day: "2-digit", month: "2-digit" }).format(new Date(iso));
  return `${day} a las ${formatHourMinute(iso, timeZone)}`;
}
