/**
 * Satellite illustration, used by the offline monitor ("We've lost contact
 * with the satellite"). Inline SVG so it needs no network to load — important,
 * since it appears precisely when the connection is down.
 *
 * `drifting` adds a slow tumble; disabled under prefers-reduced-motion.
 */
export default function Satellite({
  size = 140,
  drifting = true,
  className = "",
}: {
  size?: number;
  drifting?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-block ${drifting ? "orbit-drift" : ""} ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <defs>
          <linearGradient id="sat-panel" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>

        {/* left solar panel */}
        <g transform="rotate(-8 60 60)">
          <rect x="6" y="46" width="34" height="28" rx="2" fill="url(#sat-panel)" opacity="0.9" />
          <line x1="23" y1="46" x2="23" y2="74" stroke="#0B1224" strokeWidth="1.5" />
          <line x1="6" y1="60" x2="40" y2="60" stroke="#0B1224" strokeWidth="1.5" />
          <line x1="40" y1="60" x2="48" y2="60" stroke="#9AA6C2" strokeWidth="2" />
        </g>

        {/* right solar panel */}
        <g transform="rotate(-8 60 60)">
          <rect x="80" y="46" width="34" height="28" rx="2" fill="url(#sat-panel)" opacity="0.9" />
          <line x1="97" y1="46" x2="97" y2="74" stroke="#0B1224" strokeWidth="1.5" />
          <line x1="80" y1="60" x2="114" y2="60" stroke="#0B1224" strokeWidth="1.5" />
          <line x1="72" y1="60" x2="80" y2="60" stroke="#9AA6C2" strokeWidth="2" />
        </g>

        {/* body */}
        <rect x="48" y="48" width="24" height="24" rx="4" fill="#152041" stroke="#9AA6C2" strokeWidth="2" />
        <rect x="53" y="53" width="14" height="6" rx="1.5" fill="#22D3EE" opacity="0.8" />

        {/* dish */}
        <ellipse cx="60" cy="34" rx="13" ry="7" fill="#1C2B54" stroke="#F5C24C" strokeWidth="2" transform="rotate(-20 60 34)" />
        <line x1="60" y1="40" x2="60" y2="48" stroke="#9AA6C2" strokeWidth="2" />
        <circle cx="60" cy="34" r="2" fill="#F5C24C" />

        {/* faint "lost signal" arcs, broken */}
        <path d="M74 26 a10 10 0 0 1 3 7" stroke="#F5C24C" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
        <path d="M80 20 a17 17 0 0 1 4 11" stroke="#F5C24C" strokeWidth="1.5" opacity="0.28" strokeLinecap="round" strokeDasharray="2 4" />
      </svg>
    </span>
  );
}
