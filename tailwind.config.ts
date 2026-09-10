import type { Config } from "tailwindcss";

/**
 * Space-theme semantic tokens. Use these instead of scattering raw hex values.
 * - space-navy: deep background matching the logo (#0B1224)
 * - orbit-blue / orbit-cyan: the blue->cyan accent gradient
 * - orbit-gold: the soft gold/amber planet + orbit-line accent
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Repointed to the exact palette used by the admin's uploaded HTML
        // lessons (New_Text_Document.html) so "blocks" lessons and "html"
        // lessons are visually identical.
        "space-navy": {
          DEFAULT: "#050816",
          800: "#0A0E27",
          700: "#111638",
          600: "#1A1F4E",
          500: "#252B6A",
        },
        "orbit-blue": "#3B82F6",
        "orbit-cyan": "#00D4FF",
        "orbit-gold": "#FF8C42",
        "space-ink": "#E2E8F0", // primary readable text on navy
        "space-muted": "#94A3B8", // secondary text
        // Extra nebula accents used by callouts / syntax highlighting.
        "nebula-purple": "#7B2FF7",
        "nebula-pink": "#FF6B9D",
        "nebula-green": "#00E88F",
        "code-bg": "#0D1117",
      },
      fontFamily: {
        sans: ["var(--font-arabic)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "orbit-gradient": "linear-gradient(135deg, #7B2FF7 0%, #00D4FF 100%)",
      },
      boxShadow: {
        orbit: "0 0 0 1px rgba(123,47,247,0.15), 0 8px 30px rgba(0,0,0,0.35)",
      },
      maxWidth: {
        reading: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
