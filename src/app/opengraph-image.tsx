import { ImageResponse } from "next/og";

/**
 * Auto-generated social preview image (og:image / twitter:image). Next.js
 * picks this up automatically for the whole site (any route without its own
 * opengraph-image.tsx inherits this one), so links shared on WhatsApp,
 * Twitter/X, Telegram, Facebook, etc. always show a proper branded card
 * instead of a blank/default preview.
 */
export const runtime = "edge";
export const alt = "Orbiet — مدار | تعلّم البرمجة";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "مدار · تعلّم البرمجة خطوة بخطوة";

// Satori (the renderer behind ImageResponse) ships with a Latin-only default
// font, so Arabic text needs its glyphs loaded explicitly or it renders as
// blank boxes. We fetch just the Kufi Arabic weight/subset we actually use,
// scoped to the exact characters in TAGLINE, keeping this fast and small.
async function loadArabicFont(text: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@700&text=${encodeURIComponent(
    text
  )}`;
  const css = await fetch(cssUrl, {
    // Force a UA that gets served .ttf (Satori needs ttf/otf, not woff2).
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  }).then((r) => r.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) return null;

  const res = await fetch(match[1]);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

export default async function OpengraphImage() {
  const arabicFontData = await loadArabicFont(TAGLINE).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 25% 20%, #12224e 0%, #0B1224 55%, #060a17 100%)",
          position: "relative",
        }}
      >
        {/* scattered stars */}
        {[
          [90, 80], [260, 140], [1120, 90], [980, 200], [140, 480],
          [1060, 520], [60, 300], [1150, 350], [620, 60], [700, 560],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#E8EDF7",
              opacity: 0.8,
            }}
          />
        ))}

        {/* dashed orbit ring */}
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 260,
            borderRadius: "50%",
            border: "2px dashed rgba(245,194,76,0.45)",
            transform: "rotate(-8deg)",
          }}
        />

        {/* small orbiting planet */}
        <div
          style={{
            position: "absolute",
            right: 250,
            top: 165,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #7DD3FC, #3B82F6 60%, #14285C 100%)",
          }}
        />

        {/* graduation-cap mark, echoing the site logo */}
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#0B1224",
            border: "2px solid #1C2B54",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            fontSize: 48,
          }}
        >
          🎓
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -2,
            color: "#E8EDF7",
          }}
        >
          <span style={{ color: "#22D3EE" }}>O</span>
          <span>rbiet</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 34,
            color: "#8B9AC7",
            fontFamily: arabicFontData ? "Kufi" : undefined,
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: arabicFontData
        ? [{ name: "Kufi", data: arabicFontData, weight: 700, style: "normal" }]
        : [],
    }
  );
}