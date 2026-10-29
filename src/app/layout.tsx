import type { Metadata, Viewport } from "next";
import { Grenze_Gotisch, IM_Fell_English_SC, Roboto_Condensed } from "next/font/google";
import "./globals.css";

// next/font descarga las fuentes en el build y las sirve desde el propio dominio:
// en el móvil no se hace ninguna petición a Google. Si fallan, globals.css tiene alternativas del sistema.
const titleFont = Grenze_Gotisch({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-title", display: "swap" });
const printFont = IM_Fell_English_SC({ subsets: ["latin"], weight: "400", variable: "--font-print", display: "swap" });
const bodyFont = Roboto_Condensed({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body", display: "swap" });

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
    <html lang="es" className={`${titleFont.variable} ${printFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
