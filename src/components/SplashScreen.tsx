"use client";

/**
 * Full-screen space-themed splash / boot screen shown once per browser
 * session (sessionStorage-gated) while the app "establishes contact" with
 * the station. Purely decorative — never blocks real content for long, and
 * fades itself out automatically.
 *
 * Respects prefers-reduced-motion: skips the animated sequence and just
 * shows the mark briefly, then dismisses.
 */
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

const SESSION_KEY = "orbiet-splash-shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadyShown = false;
    }

    if (alreadyShown) return;

    setVisible(true);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const totalMs = reduceMotion ? 500 : 1600;
    const start = Date.now();

    const tick = window.setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / totalMs) * 100));
      setProgress(pct);
      if (pct >= 100) window.clearInterval(tick);
    }, 40);

    const leaveTimer = window.setTimeout(() => setLeaving(true), totalMs);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }, totalMs + 450);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-space-navy transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-label="جارِ الإقلاع"
    >
      {/* background texture */}
      <div className="starfield opacity-80" aria-hidden="true" />

      {/* orbiting ring behind the logo */}
      <div className="relative mb-8 flex items-center justify-center">
        <span
          className="splash-ring absolute h-40 w-40 rounded-full border border-dashed border-orbit-cyan/30 sm:h-48 sm:w-48"
          aria-hidden="true"
        />
        <span
          className="splash-ring-2 absolute h-28 w-28 rounded-full border border-dashed border-orbit-gold/30 sm:h-32 sm:w-32"
          aria-hidden="true"
        />
        <span className="splash-orbit-dot absolute" aria-hidden="true">
          <span className="block h-2.5 w-2.5 rounded-full bg-orbit-cyan shadow-[0_0_12px_3px_rgba(0,212,255,0.7)]" />
        </span>
        <div className="orbit-pulse relative z-10 scale-125 sm:scale-150">
          <Logo withText={false} />
        </div>
      </div>

      <bdi dir="ltr" className="mb-6 text-2xl font-extrabold tracking-tight">
        <span className="orbit-gradient-text">O</span>
        <span className="text-space-ink">rbiet</span>
      </bdi>

      <p className="mb-4 text-sm text-space-muted">جارِ الاتصال بالمحطة المدارية…</p>

      {/* progress bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-space-navy-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orbit-blue to-orbit-cyan transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
