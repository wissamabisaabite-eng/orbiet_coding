import type { Metadata, Viewport } from "next";
import "./globals.css";
import Starfield from "@/components/Starfield";
import TwinkleStars from "@/components/space/TwinkleStars";
import ConnectionMonitor from "@/components/space/ConnectionMonitor";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import SplashScreen from "@/components/SplashScreen";
import QuickSearch from "@/components/QuickSearch";
import Link from "next/link";

/*
 * ============================================================================
 *  BIDI-SAFETY REQUIREMENT — PLEASE READ BEFORE EDITING (do not strip this).
 * ============================================================================
 *  Orbiet is an Arabic-first (RTL) site, but almost every page mixes inline
 *  English words and code into Arabic sentences (e.g. "تعلم Flutter بسهولة",
 *  "استخدم useState هنا"). If the bidirectional algorithm isn't contained,
 *  those Latin runs, code tokens, punctuation, and multi-digit numbers get
 *  visually reordered/reversed.
 *
 *  The invariants that keep mixed text correct:
 *   1. <html dir="rtl" lang="ar"> is set here at the root.
 *   2. Layout uses CSS *logical* properties everywhere (margin-inline-*,
 *      padding-inline-*, text-align:start) — never physical left/right — so
 *      the UI mirrors correctly under RTL without manual overrides.
 *   3. Any inline Latin/code inside Arabic is wrapped with <Ltr>/<Isolate>
 *      (components/Bidi.tsx) => real <bdi> with unicode-bidi isolation.
 *   4. Code blocks always render dir="ltr" internally (see CodeBlock).
 *   5. Numbers use Western digits and are wrapped in <bdi dir="ltr">.
 *
 *  If you remove any of these, mixed Arabic+English text WILL break visually.
 * ============================================================================
 */

// Fonts (Noto Kufi Arabic, JetBrains Mono, Lalezar) are loaded via a plain
// <link> tag in <head> below instead of next/font/google. next/font fetches
// font files from Node.js at build/dev time, which some environments (e.g.
// certain antivirus/firewall setups that allow browser traffic but block
// Node's own outbound requests) silently break, permanently falling back to
// a system font. Loading via <link> lets the BROWSER fetch the font instead,
// which is unaffected by that class of problem. See globals.css for the
// --font-arabic / --font-mono / --font-heading variable definitions.

// Base URL used to build absolute OG/Twitter image + canonical URLs.
// Set NEXT_PUBLIC_SITE_URL in your .env(.local)/hosting env to your real
// domain (e.g. https://orbiet.app) once you have one — this is only a
// fallback so metadata still resolves during local development.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orbiet.app";

// Explicit viewport config: without this, some environments fall back to a
// desktop-width viewport on mobile, making the whole page render tiny/huge
// and requiring both horizontal AND vertical scrolling to see anything.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B1224",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orbiet — مدار | تعلّم البرمجة",
    template: "%s | Orbiet",
  },
  description:
    "مدار (Orbiet): منصّة تعليمية تقودك في مسار تعلّم البرمجة، محطة بعد محطة.",
  applicationName: "Orbiet",
  keywords: [
    "تعلم البرمجة",
    "دورات برمجة بالعربي",
    "تعلم البرمجة بالعربية",
    "دروس برمجة",
    "مدار",
    "Orbiet",
  ],
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  // og:image / twitter:image are generated automatically by
  // src/app/opengraph-image.tsx (and used as the fallback for every page
  // that doesn't define its own), so social previews always show the
  // Orbiet mark instead of a blank card.
  openGraph: {
    type: "website",
    locale: "ar",
    siteName: "Orbiet",
    title: "Orbiet — مدار | تعلّم البرمجة",
    description:
      "منصّة تعليمية عربية تقودك في مسار تعلّم البرمجة، محطة بعد محطة.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbiet — مدار | تعلّم البرمجة",
    description:
      "منصّة تعليمية عربية تقودك في مسار تعلّم البرمجة، محطة بعد محطة.",
  },
  // Favicon/app icons are generated automatically by src/app/icon.tsx —
  // no static image files needed.

  // Site-ownership verification meta tags for ad-network approval.
  other: {
    
    // ExoClick — <meta name="6a97888e-site-verification" content="...">
    "6a97888e-site-verification": "e85c7f2f0a0d3e6ef48a84d08dd9c281",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // dir="rtl" lang="ar" — see the bidi-safety note above.
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Lalezar&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {/* Boot/splash overlay: shown once per session, then fades out. */}
        <SplashScreen />
        <Starfield />
        <TwinkleStars />
        {/* Offline overlay: "We've lost contact with the satellite". */}
        <ConnectionMonitor />
        <header className="sticky top-0 z-30 border-b border-orbit-blue/15 bg-space-navy/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <Logo />
            <nav className="flex items-center gap-1 overflow-x-auto sm:gap-2">
              <QuickSearch />
              <Link href="/" className="btn-ghost px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                الرئيسية
              </Link>
              <Link href="/about" className="btn-ghost px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                من نحن
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4">{children}</main>

        <Footer />
      </body>
    </html>
  );
}