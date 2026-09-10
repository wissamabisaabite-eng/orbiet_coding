import Link from "next/link";

/**
 * Orbiet wordmark + icon. The icon is a compact inline SVG evoking the brand
 * mark: a rounded navy square, a graduation cap, an orbit ring with a small
 * gold planet, and a couple of stars. The wordmark keeps the Latin spelling
 * LTR (it's a brand name) even inside the RTL shell.
 */
export default function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2" aria-label="Orbiet — الصفحة الرئيسية">
      <svg
        width="36"
        height="36"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1" y="1" width="46" height="46" rx="12" fill="#0B1224" stroke="#1C2B54" />
        {/* orbit ring */}
        <ellipse
          cx="24"
          cy="26"
          rx="17"
          ry="8"
          fill="none"
          stroke="#F5C24C"
          strokeWidth="1.5"
          opacity="0.8"
          transform="rotate(-20 24 26)"
        />
        {/* orbiting planet */}
        <circle cx="39" cy="20" r="2.6" fill="#F5C24C" />
        {/* graduation cap */}
        <path d="M24 12 L36 17 L24 22 L12 17 Z" fill="url(#orbit-cap)" />
        <path d="M30 19.5 V25 C30 27 18 27 18 25 V19.5" fill="#152041" stroke="#3B82F6" strokeWidth="1" />
        {/* tassel */}
        <line x1="36" y1="17" x2="36" y2="23" stroke="#22D3EE" strokeWidth="1" />
        <circle cx="36" cy="23.5" r="1" fill="#22D3EE" />
        {/* stars */}
        <circle cx="9" cy="10" r="0.9" fill="#E8EDF7" />
        <circle cx="40" cy="34" r="0.9" fill="#E8EDF7" />
        <defs>
          <linearGradient id="orbit-cap" x1="12" y1="12" x2="36" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
      {withText && (
        <bdi dir="ltr" className="text-xl font-extrabold tracking-tight">
          <span className="orbit-gradient-text">O</span>
          <span className="text-space-ink">rbiet</span>
        </bdi>
      )}
    </Link>
  );
}
