import { ImageResponse } from "next/og";

/**
 * Auto-generated app icon (favicon + the icon browsers/OSs show for tabs,
 * bookmarks, and "add to home screen"). Next.js serves this at /icon
 * automatically — no .ico/.png asset to keep in sync with the logo.
 */
export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1224",
          borderRadius: 16,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48">
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
          <circle cx="39" cy="20" r="2.6" fill="#F5C24C" />
          <path d="M24 12 L36 17 L24 22 L12 17 Z" fill="#3B82F6" />
          <path
            d="M30 19.5 V25 C30 27 18 27 18 25 V19.5"
            fill="#152041"
            stroke="#3B82F6"
            strokeWidth="1"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}