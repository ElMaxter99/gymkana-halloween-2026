import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hmac, safeEqual } from "./crypto";

export const ADMIN_COOKIE = "gk_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return s;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

/** Sesión firmada: «caducidad.nombre.firma». El nombre (opcional) aparece en el historial del marcador. */
export function createAdminSession(name = ""): string {
  const exp = String(Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS);
  const who = Buffer.from(name.slice(0, 40), "utf8").toString("base64url");
  return `${exp}.${who}.${hmac(`${exp}.${who}`, secret())}`;
}

type AdminSession = { name: string };

async function readSession(): Promise<AdminSession | null> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return null;
  const [exp, who, sig] = value.split(".");
  if (!exp || who === undefined || !sig) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!safeEqual(sig, hmac(`${exp}.${who}`, secret()))) return null;
  return { name: Buffer.from(who, "base64url").toString("utf8") };
}

export async function isAdmin(): Promise<boolean> {
  return (await readSession()) !== null;
}

/** Nombre del organizador para el historial («organizador» si no lo escribió al entrar). */
export async function getAdminName(): Promise<string> {
  return (await readSession())?.name.trim() || "organizador";
}

/** Para páginas y server actions: redirige al login si no hay sesión. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
