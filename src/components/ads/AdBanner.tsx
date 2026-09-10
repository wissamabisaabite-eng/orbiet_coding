/**
 * Adsterra banner slot — a genuine page component (not an injected string).
 *
 * Fill in the three zone keys below via env vars once you create the
 * corresponding "Banner" ad units in your Adsterra dashboard:
 *   NEXT_PUBLIC_ADSTERRA_KEY_LEADERBOARD  -> 728x90 unit
 *   NEXT_PUBLIC_ADSTERRA_KEY_MOBILE       -> 320x50 unit
 *   NEXT_PUBLIC_ADSTERRA_KEY_SIDEBAR      -> 300x250 unit
 *
 * Until a key is set, this renders a fixed-size dashed placeholder instead of
 * a blank/broken iframe, so layout never shifts once the real key is added.
 *
 * Placement rules (enforced by callers, not here):
 *   - Homepage: one banner below the hero, one between the grid and footer.
 *   - Lesson page: a desktop-only sidebar banner (hidden on mobile).
 *   - NEVER inside the lesson content stream (between content_blocks) -- that
 *     breaks the reading/learning flow.
 */
import AdsterraSlot from "./AdsterraSlot";

type AdFormat = "leaderboard" | "mobile" | "sidebar";

const SIZES: Record<AdFormat, { w: number; h: number; label: string }> = {
  leaderboard: { w: 728, h: 90, label: "728x90" },
  mobile: { w: 320, h: 50, label: "320x50" },
  sidebar: { w: 300, h: 250, label: "300x250" },
};

const KEYS: Record<AdFormat, string | undefined> = {
  leaderboard: process.env.NEXT_PUBLIC_ADSTERRA_KEY_LEADERBOARD,
  mobile: process.env.NEXT_PUBLIC_ADSTERRA_KEY_MOBILE,
  sidebar: process.env.NEXT_PUBLIC_ADSTERRA_KEY_SIDEBAR,
};

export default function AdBanner({
  slot,
  format = "leaderboard",
  className = "",
}: {
  /** Identifier for the Adsterra ad unit that will fill this slot. */
  slot: string;
  format?: AdFormat;
  className?: string;
}) {
  const { w, h, label } = SIZES[format];
  const key = KEYS[format];

  if (key) {
    return (
      <div
        className={`mx-auto flex items-center justify-center overflow-hidden ${className}`}
        style={{ maxWidth: "100%" }}
        data-ad-slot={slot}
      >
        <AdsterraSlot adKey={key} width={w} height={h} />
      </div>
    );
  }

  // No key configured yet -- reserve the exact space so nothing shifts later.
  return (
    <div
      className={`mx-auto flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-orbit-blue/25 bg-space-navy-800/40 text-space-muted ${className}`}
      style={{ width: w, height: h, maxWidth: "100%" }}
      data-ad-slot={slot}
      aria-label="مساحة إعلانية"
    >
      <span className="select-none text-xs" dir="ltr">
        Ad - {label} (set NEXT_PUBLIC_ADSTERRA_KEY_{format.toUpperCase()})
      </span>
    </div>
  );
}
