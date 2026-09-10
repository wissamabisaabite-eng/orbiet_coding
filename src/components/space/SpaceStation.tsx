/**
 * A small space-station icon used to mark a module (a "docking station" the
 * learner visits before exploring its lesson-planets). Deterministic accent
 * color from the seed. Purely decorative.
 */
import { planetPalette } from "@/lib/planet";

export default function SpaceStation({
  seed,
  size = 44,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const p = planetPalette(seed);
  return (
    <span
      className={`inline-block ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* solar panels */}
        <rect x="2" y="27" width="16" height="10" rx="1.5" fill={p.base} opacity="0.85" />
        <rect x="46" y="27" width="16" height="10" rx="1.5" fill={p.base} opacity="0.85" />
        <line x1="10" y1="27" x2="10" y2="37" stroke="#0B1224" strokeWidth="1" />
        <line x1="54" y1="27" x2="54" y2="37" stroke="#0B1224" strokeWidth="1" />
        {/* connecting truss */}
        <rect x="18" y="30.5" width="28" height="3" rx="1.5" fill="#9AA6C2" />
        {/* core module */}
        <rect x="24" y="22" width="16" height="20" rx="6" fill="#152041" stroke={p.accent} strokeWidth="2" />
        {/* window */}
        <circle cx="32" cy="32" r="3.5" fill={p.light} />
        {/* antenna */}
        <line x1="32" y1="22" x2="32" y2="14" stroke="#9AA6C2" strokeWidth="1.5" />
        <circle cx="32" cy="13" r="1.8" fill={p.accent} />
      </svg>
    </span>
  );
}
