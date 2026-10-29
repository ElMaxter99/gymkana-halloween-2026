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
