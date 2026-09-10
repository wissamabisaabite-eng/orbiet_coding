"use client";

/**
 * Connection monitor. When the browser goes offline, we show a friendly
 * space-themed overlay: "We've lost contact with the satellite" with a
 * drifting satellite illustration. When the connection returns, the overlay
 * auto-dismisses.
 *
 * Comfort-first: this does NOT unmount the page underneath (so scroll position
 * and state are preserved), it just overlays. The satellite art is inline SVG,
 * so it renders even with no network.
 */
import { useEffect, useState } from "react";
import Satellite from "./Satellite";

export default function ConnectionMonitor() {
  // Start "online": navigator may be undefined during SSR, and we only ever
  // flip to offline in response to a real event on the client.
  const [offline, setOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    // Sync with the real state on mount (e.g. loaded while already offline).
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOffline(true);
    }

    const goOffline = () => {
      setOffline(true);
      setReconnected(false);
    };
    const goOnline = () => {
      setOffline(false);
      // Briefly confirm reconnection with a small toast.
      setReconnected(true);
      window.setTimeout(() => setReconnected(false), 2500);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <>
      {offline && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-space-navy/95 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label="انقطع الاتصال"
        >
          {/* a couple of stray stars for atmosphere */}
          <div className="pointer-events-none absolute inset-0 starfield opacity-60" aria-hidden="true" />

          <div className="relative max-w-md text-center">
            <Satellite size={160} className="mx-auto mb-4" />
            <h2 className="mb-2 text-2xl font-bold text-white">
              فقدنا الاتصال بالقمر الصناعي
            </h2>
            <p className="mb-1 text-space-muted">
              يبدو أن مركبتك خرجت من نطاق التغطية. تحقّق من اتصالك بالإنترنت.
            </p>
            <p className="text-sm text-space-muted/70">
              سنعيد الاتصال تلقائيًا فور عودة الإشارة…
            </p>

            {/* calm pulsing "searching" dots */}
            <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
              <span className="orbit-pulse h-2 w-2 rounded-full bg-orbit-cyan" style={{ animationDelay: "0ms" }} />
              <span className="orbit-pulse h-2 w-2 rounded-full bg-orbit-blue" style={{ animationDelay: "200ms" }} />
              <span className="orbit-pulse h-2 w-2 rounded-full bg-orbit-gold" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        </div>
      )}

      {reconnected && (
        <div
          className="fixed inset-x-0 bottom-4 z-[60] mx-auto w-fit rounded-full border border-emerald-500/40 bg-space-navy-800/95 px-4 py-2 text-sm text-emerald-300 shadow-orbit"
          role="status"
        >
          عاد الاتصال بالقمر الصناعي ✦
        </div>
      )}
    </>
  );
}
