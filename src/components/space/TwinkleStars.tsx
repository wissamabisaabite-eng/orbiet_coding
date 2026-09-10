/**
 * A sparse layer of gently twinkling stars + an occasional shooting star,
 * layered on top of the static starfield for a livelier (but still calm)
 * space-game feel. Decorative only; animation is disabled under
 * prefers-reduced-motion (see globals.css).
 *
 * Positions are deterministic (fixed array) so there's no hydration mismatch
 * between server and client render.
 */
const STARS = [
  { top: "8%", left: "12%", size: 2, delay: "0s", color: "#E8EDF7" },
  { top: "18%", left: "82%", size: 3, delay: "0.6s", color: "#F5C24C" },
  { top: "30%", left: "45%", size: 2, delay: "1.2s", color: "#22D3EE" },
  { top: "42%", left: "22%", size: 2, delay: "1.8s", color: "#E8EDF7" },
  { top: "55%", left: "70%", size: 3, delay: "0.3s", color: "#E8EDF7" },
  { top: "63%", left: "38%", size: 2, delay: "2.1s", color: "#F5C24C" },
  { top: "72%", left: "88%", size: 2, delay: "1.5s", color: "#22D3EE" },
  { top: "84%", left: "15%", size: 3, delay: "0.9s", color: "#E8EDF7" },
  { top: "90%", left: "60%", size: 2, delay: "2.4s", color: "#E8EDF7" },
  { top: "12%", left: "58%", size: 2, delay: "1.1s", color: "#22D3EE" },
];

export default function TwinkleStars() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden" aria-hidden="true">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="orbit-twinkle absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
