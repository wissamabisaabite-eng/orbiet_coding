"use client";

/**
 * Client half of the html-lesson renderer: holds the sandboxed iframe and a
 * "fill the whole screen" toggle button. Uses the native Fullscreen API on
 * the wrapping container, with a CSS-only fallback (fixed overlay) for
 * browsers/contexts where requestFullscreen isn't available (e.g. some
 * embedded/mobile webviews).
 */
import { useEffect, useRef, useState } from "react";

export default function HtmlLessonFrame({
  html,
  fullBleed = false,
}: {
  html: string;
  /** Fill the whole viewport width/height by default (dedicated lesson page)
   *  instead of sitting inside the reading column at a fixed 70vh. */
  fullBleed?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        // Fallback: no Fullscreen API support — just expand via CSS.
        setIsFullscreen((v) => !v);
      }
    } catch {
      // Fullscreen can be blocked (e.g. no user gesture, iframe restrictions);
      // fall back to the CSS-only expanded view instead of failing silently.
      setIsFullscreen((v) => !v);
    }
  };

  const cssFallbackExpanded = isFullscreen && !document.fullscreenElement;

  return (
    <div
      ref={containerRef}
      className={
        cssFallbackExpanded
          ? "fixed inset-0 z-[70] flex flex-col bg-white"
          : "relative overflow-hidden bg-white"
      }
    >
      {/* Fullscreen toggle: sits above the iframe, never inside the sandbox. */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute end-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-orbit-blue/30 bg-space-navy/85 px-3 py-1.5 text-xs font-medium text-space-ink shadow-orbit backdrop-blur transition-colors hover:bg-space-navy"
        aria-pressed={isFullscreen}
        aria-label={isFullscreen ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
      >
        {isFullscreen ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            تصغير
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            ملء الشاشة
          </>
        )}
      </button>

      <iframe
        srcDoc={html}
        // Isolated: scripts allowed, but no same-origin access to the parent.
        sandbox="allow-scripts allow-popups"
        className={
          cssFallbackExpanded
            ? "h-full w-full flex-1"
            : isFullscreen
              ? "h-screen w-full"
              : fullBleed
                ? "h-[calc(100vh-4rem)] min-h-[520px] w-full"
                : "h-[70vh] w-full"
        }
        title="محتوى الدرس"
      />
    </div>
  );
}
