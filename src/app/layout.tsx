import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Roboto_Condensed } from "next/font/google";
import "./globals.css";

// next/font descarga las fuentes en el build y las sirve desde el propio dominio:
// en el móvil no se hace ninguna petición a Google. Si fallan, globals.css tiene alternativas del sistema.
// Las mismas familias que las hojas impresas: slab serif gruesa para títulos y condensada para el texto.
const titleFont = Alfa_Slab_One({ subsets: ["latin"], weight: "400", variable: "--font-title", display: "swap" });
const bodyFont = Roboto_Condensed({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-body", display: "swap" });

const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Gymkana Halloween 2026",
  description: "La noche ha comenzado. Registra tu equipo y descubre sus secretos.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Gymkana Halloween 2026",
    description: "La web que da vida a tu aventura",
    images: ["/branding/og-gymkana-halloween-2026.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17130F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titleFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
