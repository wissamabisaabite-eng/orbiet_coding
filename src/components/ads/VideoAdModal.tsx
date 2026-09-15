"use client";

/**
 * Mandatory ~10-second video-ad gate shown BETWEEN lessons (every
 * LESSONS_BETWEEN_VIDEO_ADS in-app "Next lesson" transitions — NOT on every
 * transition, to avoid wrecking the reading/learning flow).
 *
 * REAL VIDEO AD (VAST) — how this works:
 *   HilltopAds gives a "VAST Tag URL" (an XML ad-tag URL), not a ready-made
 *   <script> snippet. A VAST tag is only useful if something knows how to
 *   request it and render the resulting video creative inside a real
 *   <video> element — that "something" is Google's IMA SDK, the free,
 *   industry-standard VAST player used across the web. We load it lazily
 *   (only when this modal actually opens, not on every page) and hand it
 *   the VAST tag URL from NEXT_PUBLIC_HILLTOP_VAST_TAG_URL.
 *
 * FALLBACK — why it exists and how it triggers:
 *   VAST/IMA can fail silently for many reasons outside our control: ad
 *   blockers (very common — IMA's own script is a frequent blocklist
 *   target), no fill for the user's GEO, network issues, etc. Rather than
 *   showing a broken/empty box, we race the real ad against a short timer.
 *   If the IMA ad hasn't started by AD_FALLBACK_TIMEOUT_MS, OR IMA reports
 *   an AdError, we tear down the IMA attempt and fall back to the plain
 *   Adsterra banner unit that was already working reliably
 *   (NEXT_PUBLIC_ADSTERRA_KEY_VIDEO, same as before this change).
 *
 * The mandatory countdown (Skip disabled until it hits 0) is enforced by
 * US regardless of which path renders, so the guaranteed minimum exposure
 * time is identical whether the visitor got the real video or the banner
 * fallback.
 *
 * MOBILE: the ad box keeps a fixed 16:9 aspect ratio at 100% width (same
 * pattern as before), and a ResizeObserver calls adsManager.resize(...) so
 * IMA repaints correctly on orientation change / viewport resize — IMA does
 * NOT do this automatically.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Ltr } from "@/components/Bidi";
import AdsterraSlot from "./AdsterraSlot";

// Adjust ad frequency here (show the video every Nth lesson transition).
// Kept at 3 on purpose: showing this between every single lesson would wreck
// the reading flow, so it only fires every 2-3 lesson transitions.
export const LESSONS_BETWEEN_VIDEO_ADS = 3;

const COUNTDOWN_SECONDS = 10;
const TRANSITION_KEY = "orbiet_lesson_transitions";

// How long we give the real VAST ad to actually start before giving up on it
// and showing the Adsterra banner fallback instead.
const AD_FALLBACK_TIMEOUT_MS = 6000;

// The HilltopAds VAST tag URL (from: Websites -> your zone -> copy VAST tag).
const VAST_TAG_URL = process.env.NEXT_PUBLIC_HILLTOP_VAST_TAG_URL;

// Adsterra fallback banner key (unchanged from the previous version of this
// file — this is what renders if the real video ad doesn't come through).
const FALLBACK_AD_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY_VIDEO;

/**
 * Decide whether the video ad should show for THIS in-app next transition, and
 * advance the counter. Returns true when the gate should be shown.
 * Only ever called from an in-app "Next lesson" click (never on load).
 */
export function shouldShowVideoAd(): boolean {
  if (typeof window === "undefined") return false;
  const prev = Number(sessionStorage.getItem(TRANSITION_KEY) ?? "0");
  const next = prev + 1;
  sessionStorage.setItem(TRANSITION_KEY, String(next));
  return next % LESSONS_BETWEEN_VIDEO_ADS === 0;
}

// ---------------------------------------------------------------------------
// Lazy IMA SDK script loader (module-level singleton promise so we only ever
// inject the <script> tag once, no matter how many times the modal opens).
// ---------------------------------------------------------------------------
let imaSdkPromise: Promise<void> | null = null;

function loadImaSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  // Already loaded in a previous open.
  if (window.google?.ima) return Promise.resolve();

  if (!imaSdkPromise) {
    imaSdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-ima-sdk="true"]'
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("IMA SDK failed to load"))
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
      script.async = true;
      script.dataset.imaSdk = "true";
      script.onload = () => resolve();
      // Common cause: ad blockers block this exact script by name/path.
      script.onerror = () => reject(new Error("IMA SDK failed to load"));
      document.head.appendChild(script);
    });
  }
  return imaSdkPromise;
}

type AdState = "loading" | "playing-real-ad" | "fallback-banner";

export default function VideoAdModal({
  open,
  onComplete,
}: {
  open: boolean;
  /** Called when the countdown ends or Skip is pressed — completes navigation. */
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const [adState, setAdState] = useState<AdState>("loading");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boxRef = useRef<HTMLDivElement>(null); // 16:9 outer box (for sizing)
  const adContainerRef = useRef<HTMLDivElement>(null); // IMA overlay div
  const videoRef = useRef<HTMLVideoElement>(null); // content <video> (empty, ad-only)

  const adsLoaderRef = useRef<any>(null);
  const adsManagerRef = useRef<any>(null);
  const fallbackFiredRef = useRef(false);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    onComplete();
  }, [onComplete]);

  // Switch to the plain Adsterra banner fallback. Safe to call more than
  // once (e.g. both a late AD_ERROR and the timeout firing) — only acts the
  // first time.
  const goToFallback = useCallback(() => {
    if (fallbackFiredRef.current) return;
    fallbackFiredRef.current = true;

    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;

    try {
      adsManagerRef.current?.destroy();
    } catch {
      // ignore — already torn down or never fully initialized
    }
    adsManagerRef.current = null;

    setAdState("fallback-banner");
  }, []);

  // ---- Countdown (runs identically for real ad or fallback banner) ----
  useEffect(() => {
    if (!open) return;
    setRemaining(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [open]);

  // ---- IMA / VAST setup (runs once per modal open) ----
  useEffect(() => {
    if (!open) return;

    // No VAST tag configured at all — skip straight to the fallback banner,
    // no point trying to load the SDK.
    if (!VAST_TAG_URL) {
      setAdState("fallback-banner");
      return;
    }

    let cancelled = false;
    fallbackFiredRef.current = false;
    setAdState("loading");

    // Give the real ad AD_FALLBACK_TIMEOUT_MS to prove it's actually going
    // to play. If nothing happens in time, bail to the banner.
    fallbackTimerRef.current = setTimeout(() => {
      goToFallback();
    }, AD_FALLBACK_TIMEOUT_MS);

    loadImaSdk()
      .then(() => {
        if (cancelled) return;
        const ima = window.google?.ima;
        if (!ima || !videoRef.current || !adContainerRef.current) {
          goToFallback();
          return;
        }

        const adDisplayContainer = new ima.AdDisplayContainer(
          adContainerRef.current,
          videoRef.current
        );
        const adsLoader = new ima.AdsLoader(adDisplayContainer);
        adsLoaderRef.current = adsLoader;

        adsLoader.addEventListener(
          ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          (e: any) => {
            if (cancelled) return;
            const adsManager = e.getAdsManager(videoRef.current);
            adsManagerRef.current = adsManager;

            adsManager.addEventListener(ima.AdEvent.Type.LOADED, () => {
              // Real ad confirmed — cancel the fallback timer.
              if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
                fallbackTimerRef.current = null;
              }
              if (!fallbackFiredRef.current) setAdState("playing-real-ad");
            });
            adsManager.addEventListener(
              ima.AdErrorEvent.Type.AD_ERROR,
              goToFallback
            );
            adsManager.addEventListener(
              ima.AdEvent.Type.ALL_ADS_COMPLETED,
              () => {
                // Real ad played fully — respect the countdown gate as usual
                // (handled by the render below / Skip button), nothing else
                // to do here.
              }
            );

            try {
              const rect = boxRef.current?.getBoundingClientRect();
              const w = Math.round(rect?.width ?? 480);
              const h = Math.round(rect?.height ?? (w * 9) / 16);
              adsManager.init(w, h, ima.ViewMode.NORMAL);
              adsManager.start();
            } catch {
              goToFallback();
            }
          }
        );

        adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, goToFallback);

        adDisplayContainer.initialize();

        const adsRequest = new ima.AdsRequest();
        adsRequest.adTagUrl = VAST_TAG_URL;
        const rect = boxRef.current?.getBoundingClientRect();
        adsRequest.linearAdSlotWidth = Math.round(rect?.width ?? 480);
        adsRequest.linearAdSlotHeight = Math.round(
          rect?.height ?? ((rect?.width ?? 480) * 9) / 16
        );

        adsLoader.requestAds(adsRequest);
      })
      .catch(() => {
        // IMA SDK itself failed to load (very often an ad blocker) —
        // straight to fallback, don't wait for the timer.
        if (!cancelled) goToFallback();
      });

    return () => {
      cancelled = true;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      try {
        adsManagerRef.current?.destroy();
      } catch {
        // ignore
      }
      adsManagerRef.current = null;
      try {
        adsLoaderRef.current?.destroy();
      } catch {
        // ignore
      }
      adsLoaderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goToFallback]);

  // ---- Resize handling for mobile orientation change / responsive width ----
  useEffect(() => {
    if (!open || adState !== "playing-real-ad") return;
    const ima = window.google?.ima;
    if (!ima || !boxRef.current) return;

    const observer = new ResizeObserver(() => {
      const rect = boxRef.current?.getBoundingClientRect();
      if (!rect || !adsManagerRef.current) return;
      try {
        adsManagerRef.current.resize(
          Math.round(rect.width),
          Math.round(rect.height),
          ima.ViewMode.NORMAL
        );
      } catch {
        // ignore — ad may have already ended
      }
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, [open, adState]);

  if (!open) return null;

  const countdownDone = remaining === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space-navy/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="استراحة إعلانية قصيرة"
    >
      <div className="card w-full max-w-2xl p-6 text-center shadow-orbit">
        <h2 className="mb-4 text-xl font-bold text-space-ink">
          استراحة قصيرة قبل الدرس التالي <span aria-hidden="true">🚀</span>
        </h2>

        {/* Fixed-size reserved 16:9 box — same box hosts either the real IMA
            ad or the Adsterra fallback banner, so layout never shifts. */}
        <div
          ref={boxRef}
          className="relative mx-auto mb-5 w-full max-w-xl overflow-hidden rounded-xl border border-orbit-blue/25 bg-space-navy-800"
        >
          <div style={{ paddingTop: "56.25%" }} />

          {/*
           * Real video ad target — a SINGLE persistent <video> + overlay div
           * that stays mounted for the whole lifetime of the modal (IMA
           * attaches to it once via adDisplayContainer.initialize() and
           * expects it to keep existing). We only ever toggle its opacity,
           * never mount/unmount it, so the refs are never shared or
           * reattached elsewhere.
           */}
          <div
            className="absolute inset-0"
            style={{ opacity: adState === "playing-real-ad" ? 1 : 0 }}
          >
            <video
              ref={videoRef}
              className="h-full w-full"
              playsInline
              muted={false}
            />
            <div ref={adContainerRef} className="absolute inset-0" />
          </div>

          {/* Fallback: the same Adsterra banner unit used before this change. */}
          {adState === "fallback-banner" && (
            <div className="absolute inset-0 flex items-center justify-center">
              {FALLBACK_AD_KEY ? (
                <AdsterraSlot adKey={FALLBACK_AD_KEY} width={480} height={270} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-space-muted">
                  <span className="text-sm" dir="ltr">
                    Set NEXT_PUBLIC_ADSTERRA_KEY_VIDEO
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Still waiting to know whether the real ad will start. */}
          {adState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center text-space-muted">
              <span className="text-sm">جارٍ تجهيز الإعلان…</span>
            </div>
          )}
        </div>

        <p className="mb-4 text-space-muted">
          {countdownDone ? (
            "يمكنك المتابعة الآن"
          ) : (
            <>
              يبدأ الدرس بعد{" "}
              <Ltr className="font-mono text-orbit-gold">{remaining}</Ltr> ثانية
            </>
          )}
        </p>

        <button
          type="button"
          className="btn-primary disabled:opacity-40"
          disabled={!countdownDone}
          onClick={finish}
        >
          {countdownDone ? "المتابعة إلى الدرس" : "الرجاء الانتظار…"}
        </button>
      </div>
    </div>
  );
}

// Minimal ambient typing so TypeScript doesn't complain about window.google.
declare global {
  interface Window {
    google?: { ima?: any };
  }
}
