/* Adornos e iconos SVG inspirados en las hojas impresas de la gymkana.
   Todos son decorativos (aria-hidden) salvo que se indique lo contrario. */

type SvgProps = { className?: string; size?: number };

export function Bat({ className, size = 48 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size * 0.5} viewBox="0 0 100 50" aria-hidden="true">
      <path
        fill="currentColor"
        d="M50 14c-2-5-4-7-4-7l-1 6c-4 0-6 3-6 3C32 6 18 2 2 8c8 2 12 8 12 14 6-4 12-3 15 2 3-4 8-5 11-1 3 3 6 7 10 12 4-5 7-9 10-12 3-4 8-3 11 1 3-5 9-6 15-2 0-6 4-12 12-14-16-6-30-2-37 8 0 0-2-3-6-3l-1-6s-2 2-4 7z"
      />
    </svg>
  );
}

export function Pumpkin({ className, size = 72 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 15c1-6 5-9 9-9-3 2-5 5-5 9" fill="none" stroke="var(--brown)" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="38" rx="27" ry="21" fill="var(--pumpkin)" />
      <path d="M20 19c-4 7-4 31 0 38M44 19c4 7 4 31 0 38M32 17v42" stroke="var(--blood)" strokeWidth="2" fill="none" opacity=".45" />
      <path d="M16 32l9-5 2 8zM48 32l-9-5-2 8z" fill="var(--ink)" />
      <path d="M17 43c5 8 25 8 30 0l-5 1-2 4-4-4-4 4-4-4-4 4-2-4z" fill="var(--ink)" />
      <ellipse cx="32" cy="38" rx="27" ry="21" fill="url(#pumpkin-glow)" />
      <defs>
        <radialGradient id="pumpkin-glow" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff0cc" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff0cc" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function Compass({ className, size = 64 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="32" cy="32" r="22" />
        <circle cx="32" cy="32" r="17" strokeDasharray="2 3" />
      </g>
      <path d="M32 4l4 28h-8zM32 60l-4-28h8z" fill="currentColor" />
      <path d="M4 32l28-4v8zM60 32l-28 4v-8z" fill="currentColor" opacity=".6" />
      <circle cx="32" cy="32" r="3" fill="var(--parchment)" stroke="currentColor" />
    </svg>
  );
}

export function Candle({ className, size = 40 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size * 1.6} viewBox="0 0 40 64" aria-hidden="true">
      <path className="flame" d="M20 4c5 7 6 11 3 15-2 3-6 3-8 0-2-4 0-8 5-15z" fill="var(--pumpkin)" />
      <path d="M20 10c2 4 2 6 1 8-1 1-2 1-3 0-1-2 0-4 2-8z" fill="#ffd27a" />
      <rect x="12" y="22" width="16" height="34" rx="2" fill="var(--cream)" />
      <path d="M12 26c3 0 3 6 5 6s1-6 4-6 2 9 4 9 2-9 3-9v-4H12z" fill="#e8d3a4" />
      <rect x="6" y="56" width="28" height="5" rx="2" fill="var(--gold)" />
    </svg>
  );
}

export function Skull({ className, size = 48 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6C18 6 9 16 9 29c0 8 4 13 8 16v9h30v-9c4-3 8-8 8-16C55 16 46 6 32 6z" fill="var(--cream)" />
      <ellipse cx="23" cy="31" rx="6" ry="7" fill="var(--ink)" />
      <ellipse cx="41" cy="31" rx="6" ry="7" fill="var(--ink)" />
      <path d="M32 38l-4 7h8z" fill="var(--ink)" />
      <path d="M24 54v-6M30 54v-6M36 54v-6M42 54v-6" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

export function WebCorner({ className, size = 120 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 0L120 40M0 0L100 100M0 0L40 120M0 0L120 8M0 0L8 120" />
        <path d="M30 10q2 12 -6 18q10 2 4 12M58 19q2 18 -10 34q14 6 6 20M86 29q4 26 -14 46q18 10 12 30" />
        <path d="M30 10q-8 6 -20 20M58 19q-16 14 -40 40M86 29q-24 22 -60 64" opacity=".8" />
      </g>
    </svg>
  );
}

export function HauntedScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 150" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="300" cy="46" r="30" fill="var(--cream)" opacity=".9" />
      <circle cx="292" cy="40" r="5" fill="#e7d4a3" />
      <circle cx="310" cy="56" r="4" fill="#e7d4a3" />
      <g fill="var(--ink)">
        <path d="M0 150v-26c40-10 80-14 120-8 30-16 70-20 110-10 40-6 90-2 170 10v34z" />
        <path d="M250 118V74l14-16 14 16v8h10V60l12-22 12 22v22h8v-14l10-12 10 12v50z" />
        <path d="M60 126V96l10-10 10 10v30zM40 128c0-14 6-26 6-26s6 12 6 26z" />
        <path d="M150 122c-2-16-10-24-18-28 8 1 14 6 18 12 2-12 8-20 16-24-6 6-10 16-10 26 4-6 10-9 16-9-8 4-14 12-16 23z" />
      </g>
      <g fill="#f2b04a">
        <rect x="270" y="86" width="5" height="7" />
        <rect x="296" y="66" width="5" height="7" />
        <rect x="305" y="92" width="5" height="7" />
        <rect x="330" y="80" width="4" height="6" />
      </g>
      <g fill="var(--ink)">
        <path d="M200 30q6-6 12 0q-4-2-6 2q-2-4-6-2z" />
        <path d="M232 18q5-5 10 0q-3-2-5 2q-2-4-5-2z" />
        <path d="M352 22q5-5 10 0q-3-2-5 2q-2-4-5-2z" />
      </g>
    </svg>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <svg className={className ?? "divider"} viewBox="0 0 240 16" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 8h96M144 8h96" stroke="currentColor" strokeWidth="1.2" />
      <path d="M120 1l7 7-7 7-7-7z" fill="currentColor" />
      <path d="M104 8l6-4v8zM136 8l-6-4v8z" fill="currentColor" opacity=".7" />
      <circle cx="98" cy="8" r="2" fill="currentColor" />
      <circle cx="142" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

/** Sello de lacre con un icono o texto dentro. */
export function WaxSeal({
  children,
  tone = "blood",
  className,
}: {
  children: React.ReactNode;
  tone?: "blood" | "gold";
  className?: string;
}) {
  return (
    <span className={`wax-seal wax-seal--${tone} ${className ?? ""}`} aria-hidden="true">
      {children}
    </span>
  );
}

/* Iconos de línea (24px) */
function Icon({ children, size = 24, className }: SvgProps & { children: React.ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const UsersIcon = (p: SvgProps) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 13.6c3 0 5.5 2 5.5 5.4" /></Icon>
);
export const KeyIcon = (p: SvgProps) => (
  <Icon {...p}><circle cx="7.5" cy="15.5" r="4" /><path d="M10.5 12.5L20 3M16 7l3 3M14 9l2 2" /></Icon>
);
export const QrIcon = (p: SvgProps) => (
  <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 18v3" /></Icon>
);
export const PinIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icon>
);
export const EnvelopeIcon = (p: SvgProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>
);
export const MapIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></Icon>
);
export const CheckIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
);
export const AlertIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17.5v.01" /></Icon>
);
export const ArrowLeftIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M15 5l-7 7 7 7" /></Icon>
);
export const ClockIcon = (p: SvgProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);

/* ---------- Iconos de las hojas de la gymkana ---------- */

export function SkullCrossbones({ className, size = 44 }: SvgProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M10 40l44 18M54 40L10 58" />
      </g>
      <g fill="currentColor">
        <circle cx="8" cy="38" r="4" /><circle cx="10" cy="44" r="3.5" />
        <circle cx="56" cy="38" r="4" /><circle cx="54" cy="44" r="3.5" />
        <circle cx="8" cy="60" r="3.5" /><circle cx="56" cy="60" r="3.5" />
        <path d="M32 4C20 4 13 12 13 22c0 6 3 10 6 12v7h26v-7c3-2 6-6 6-12C51 12 44 4 32 4z" />
      </g>
      <ellipse cx="25" cy="23" rx="5" ry="6" fill="var(--parchment)" />
      <ellipse cx="39" cy="23" rx="5" ry="6" fill="var(--parchment)" />
      <path d="M32 29l-3 6h6z" fill="var(--parchment)" />
    </svg>
  );
}

export const TrophyIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6" /></Icon>
);
export const TargetIcon = (p: SvgProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 1v5M12 18v5M1 12h5M18 12h5" /></Icon>
);
export const FlameIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-12-2 3-1 6-3 7-1-2-2-3-2-5-3 3-4 6-4 10 0 4 3 7 7 7z" /></Icon>
);
export const PentagramIcon = (p: SvgProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 3.5l5 15.5L4 9.5h16L7 19z" /></Icon>
);
export const ScaleIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M12 3v18M7 21h10M4 7h16M6 7l-3 7h6zM18 7l-3 7h6z" /></Icon>
);
export const ShieldCheckIcon = (p: SvgProps) => (
  <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></Icon>
);

/* ---------- Emblemas de los equipos fijos ---------- */

function Ghost({ size = 40 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6c-12 0-20 9-20 21v29l6-5 5 5 5-5 4 5 4-5 5 5 5-5 6 5V27C52 15 44 6 32 6z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2" />
      <ellipse cx="25" cy="28" rx="4" ry="6" fill="var(--ink)" />
      <ellipse cx="39" cy="28" rx="4" ry="6" fill="var(--ink)" />
      <ellipse cx="32" cy="41" rx="4" ry="5" fill="var(--ink)" />
    </svg>
  );
}

function WitchHat({ size = 40 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M36 4c-6 4-14 20-18 36h28c-2-10-4-18-2-24 2-4 6-5 8-4-3-5-10-9-16-8z" fill="var(--ink)" stroke="var(--cream)" strokeWidth="1.5" />
      <rect x="17" y="34" width="30" height="6" fill="var(--pumpkin)" />
      <rect x="28" y="33" width="8" height="8" rx="1" fill="none" stroke="var(--gold)" strokeWidth="2" />
      <ellipse cx="32" cy="46" rx="29" ry="7" fill="var(--ink)" stroke="var(--cream)" strokeWidth="1.5" />
    </svg>
  );
}

function ZombieHand({ size = 40 }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M2 58c8-4 20-6 30-6s22 2 30 6v4H2z" fill="var(--brown)" />
      <path
        d="M24 54V34l-6-10c-1-3 2-5 4-3l5 7V12c0-3 4-3 4 0v14V8c0-3 4-3 4 0v18-14c0-3 4-3 4 0v16-10c0-3 4-3 4 0v16c0 6-2 10-5 13v5z"
        fill="#7f9a5a"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M30 40l3 2M36 46l-3 1" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}

export function TeamEmblem({ name, slug, size = 40 }: { name: string; slug?: string | null; size?: number }) {
  switch ((slug ?? name).trim().toLowerCase()) {
    case "calabaza":
      return <Pumpkin size={size} />;
    case "fantasma":
      return <Ghost size={size} />;
    case "bruja":
      return <WitchHat size={size} />;
    case "zombie":
    case "zombi":
      return <ZombieHand size={size} />;
    default:
      return <span aria-hidden="true">{name.trim().charAt(0).toUpperCase() || "?"}</span>;
  }
}
