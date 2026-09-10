import { planetHasRing, planetPalette, planetTilt } from "@/lib/planet";

/**
 * A decorative SVG planet, deterministically styled from a seed (course/lesson
 * id). Same seed => same planet, every time. Purely cosmetic.
 *
 * Reduced-motion friendly: any float/spin animation lives in CSS and is
 * disabled under `prefers-reduced-motion` (see globals.css).
 */
export default function Planet({
  seed,
  size = 72,
  className = "",
  float = false,
  label,
}: {
  seed: string;
  size?: number;
  className?: string;
  /** gentle bobbing animation (disabled under reduced motion) */
  float?: boolean;
  /** optional short glyph/number drawn on the planet (e.g. lesson number) */
  label?: string;
}) {
  const p = planetPalette(seed);
  const ring = planetHasRing(seed);
  const tilt = planetTilt(seed);
  const gid = `planet-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <span
      className={`inline-block ${float ? "orbit-float" : ""} ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
          {/* Spherical shading: light side -> base -> dark side. */}
          <radialGradient id={`${gid}-body`} cx="35%" cy="32%" r="75%">
            <stop offset="0%" stopColor={p.light} />
            <stop offset="45%" stopColor={p.base} />
            <stop offset="100%" stopColor={p.shadow} />
          </radialGradient>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={p.accent} stopOpacity="0" />
            <stop offset="100%" stopColor={p.accent} stopOpacity="0.35" />
          </radialGradient>
          <clipPath id={`${gid}-clip`}>
            <circle cx="50" cy="50" r="34" />
          </clipPath>
        </defs>

        {/* soft glow halo */}
        <circle cx="50" cy="50" r="46" fill={`url(#${gid}-glow)`} />

        {/* ring behind the planet */}
        {ring && (
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="15"
            fill="none"
            stroke={p.accent}
            strokeWidth="3"
            opacity="0.55"
            transform={`rotate(${tilt} 50 50)`}
          />
        )}

        {/* planet body */}
        <circle cx="50" cy="50" r="34" fill={`url(#${gid}-body)`} />

        {/* surface detail: a few craters/bands, clipped to the sphere */}
        <g clipPath={`url(#${gid}-clip)`} opacity="0.35">
          <ellipse cx="40" cy="60" rx="10" ry="4" fill={p.shadow} />
          <ellipse cx="62" cy="42" rx="6" ry="3" fill={p.shadow} />
          <ellipse cx="55" cy="68" rx="5" ry="2.5" fill={p.light} opacity="0.5" />
        </g>

        {/* terminator shading on the dark side */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="#0B1224"
          opacity="0.28"
          clipPath={`url(#${gid}-clip)`}
          transform="translate(14 10)"
        />

        {/* ring front half (over the planet's lower edge) */}
        {ring && (
          <path
            d="M 4 50 A 46 15 0 0 0 96 50"
            fill="none"
            stroke={p.accent}
            strokeWidth="3"
            opacity="0.8"
            transform={`rotate(${tilt} 50 50)`}
          />
        )}

        {label && (
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="26"
            fontWeight="700"
            fill="#0B1224"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {label}
          </text>
        )}
      </svg>
    </span>
  );
}
