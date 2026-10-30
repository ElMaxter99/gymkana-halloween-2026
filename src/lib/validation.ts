const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Texto visible (nombres): sin caracteres de control, espacios colapsados y recortado. */
export function cleanName(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Ubicaciones con QR que tiene que encontrar cada equipo (qué ubicaciones son se decide fuera de la web). */
export function qrGoal(): number {
  return envInt("QR_PER_TEAM", 2);
}
