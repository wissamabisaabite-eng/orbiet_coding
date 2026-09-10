import { planetPalette, planetTilt } from "@/lib/planet";
import { getMissionStage } from "@/lib/missionStage";

/**
 * Same lightweight, deterministic SVG planet as <Planet>, but its level of
 * detail grows with the mission `stage` (1..20): later stations add a ring,
 * then moons, then blinking station lights, then an extra glow halo. Color
 * still comes from `seed` (usually the lesson id) so lessons keep their own
 * distinct look — `stage` only adds detail on top of it.
 *
 * Pure SVG, no images/icon packages, no extra network requests — so adding
 * more detail costs a handful of extra vector shapes, nothing that affects
 * performance.
 */
export default function MissionPlanet({
  seed,
  stage,
  size = 72,
  className = "",
  float = false,
  label,
}: {
  seed: string;
  /** 1..20 station on the fixed journey map — see lib/missionStage.ts */
  stage: number;
  size?: number;
  className?: string;
  float?: boolean;
  label?: string;
}) {
  const p = planetPalette(seed);
  const tilt = planetTilt(seed);
  const { tier, name } = getMissionStage(stage);
  const gid = `mp-${seed.replace(/[^a-zA-Z0-9]/g, "")}`;

  const hasRing = tier >= 2;
  const moonCount = Math.max(0, tier - 2); // tier 3 -> 1, tier 4 -> 2, tier 5 -> 3
  const hasStationLights = tier >= 4;
  const hasExtraGlow = tier >= 5;

  const MOON_SLOTS = [
    { angle: 25, dist: 43, r: 5.5 },
    { angle: 165, dist: 40, r: 4.5 },
    { angle: 275, dist: 45, r: 4 },
  ];
  const LIGHT_SLOTS = [
    { x: 30, y: 68, delay: "0s" },
    { x: 68, y: 34, delay: "0.6s" },
    { x: 62, y: 66, delay: "1.2s" },
  ];

  return (
    <span
      className={`inline-block ${float ? "orbit-float" : ""} ${className}`}
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 100 100" overflow="visible">
        <title>{name}</title>
        <defs>
          <radialGradient id={`${gid}-body`} cx="35%" cy="32%" r="75%">
            <stop offset="0%" stopColor={p.light} />
            <stop offset="45%" stopColor={p.base} />
            <stop offset="100%" stopColor={p.shadow} />
          </radialGradient>
          <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={p.accent} stopOpacity="0" />
            <stop offset="100%" stopColor={p.accent} stopOpacity={hasExtraGlow ? "0.55" : "0.35"} />
          </radialGradient>
          <clipPath id={`${gid}-clip`}>
            <circle cx="50" cy="50" r="34" />
          </clipPath>
        </defs>

        {/* soft glow halo — a touch bigger/brighter at the far stations */}
        <circle cx="50" cy="50" r={hasExtraGlow ? "52" : "46"} fill={`url(#${gid}-glow)`} />

        {/* ring behind the planet — appears from tier 2 (station 5) onward */}
        {hasRing && (
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

        {/* blinking station lights on the surface — later stations only */}
        {hasStationLights &&
          LIGHT_SLOTS.map((l, i) => (
            <circle
              key={i}
              cx={l.x}
              cy={l.y}
              r="1.6"
              fill="#FFFFFF"
              className="orbit-twinkle"
              style={{ animationDelay: l.delay }}
            />
          ))}

        {/* ring front half (over the planet's lower edge) */}
        {hasRing && (
          <path
            d="M 4 50 A 46 15 0 0 0 96 50"
            fill="none"
            stroke={p.accent}
            strokeWidth="3"
            opacity="0.85"
            transform={`rotate(${tilt} 50 50)`}
          />
        )}

        {/* small moons — count grows with tier (0, 1, 2 or 3) */}
        {MOON_SLOTS.slice(0, moonCount).map((m, i) => {
          const rad = (m.angle * Math.PI) / 180;
          const cx = 50 + Math.cos(rad) * m.dist;
          const cy = 50 + Math.sin(rad) * m.dist;
          return <circle key={i} cx={cx} cy={cy} r={m.r} fill={p.light} opacity="0.9" />;
        })}

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
