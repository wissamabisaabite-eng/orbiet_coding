import Planet from "@/components/space/Planet";

/**
 * Route-transition loading screen: a planet orbiting inside a spinning ring,
 * with a shooting star sweeping past, over the starfield. Calm, on-theme,
 * and brief. All motion is disabled under prefers-reduced-motion (globals.css).
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center"
      role="status"
      aria-label="جارِ التحميل"
    >
      <div className="relative mb-6 h-28 w-28">
        {/* shooting star sweeping across the loader */}
        <span className="loader-shooting-star" aria-hidden="true" />

        {/* spinning dashed ring */}
        <div
          className="loader-ring orbit-path absolute inset-0 h-28 w-28 border-orbit-cyan/40"
          aria-hidden="true"
        />
        {/* second, slower counter ring */}
        <div
          className="orbit-path absolute inset-3 h-[5.5rem] w-[5.5rem] border-orbit-gold/25"
          style={{ animation: "loader-spin 3.6s linear infinite reverse" }}
          aria-hidden="true"
        />

        {/* planet pulsing gently at the center */}
        <span className="orbit-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Planet seed="loading" size={40} />
        </span>
      </div>
      <p className="text-space-muted">جارِ الإبحار عبر المدار…</p>
    </div>
  );
}
