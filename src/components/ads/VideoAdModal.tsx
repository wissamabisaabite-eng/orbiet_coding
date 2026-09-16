"use client";

/**
 * VIDEO AD FLOW (prefetch-ahead architecture)
 * ---------------------------------------------------------------------------
 * This component is mounted by <LessonNav> BEFORE the student ever clicks
 * "الدرس التالي" — as soon as the nav (= end of the lesson content) scrolls
 * into view AND the upcoming transition is one that should show the ad gate.
 * At that point it silently prefetches the HilltopAds VAST creative in the
 * background (`mode="hidden"`): the ad request + IMA `init()` happen off
 * screen, but `adsManager.start()` is NEVER called during this phase, so
 * nothing plays and no audio is heard while the student is still reading.
 *
 * Only when the student actually clicks "Next" does the parent flip
 * `mode` to "open". At that exact moment (a direct response to a user
 * gesture, so autoplay-with-sound is allowed):
 *   - if the ad finished prefetching and is still fresh (< MAX_PREFETCH_AGE_MS
 *     old) -> play it immediately, essentially with zero wait.
 *   - if it's stale -> discard it and request a fresh one under a short
 *     timeout.
 *   - if it's still loading -> wait up to OPEN_FALLBACK_TIMEOUT_MS.
 *   - if it ultimately fails/never arrives -> show the Adsterra fallback
 *     banner instead.
 *
 * The <video>/ad-container DOM nodes are mounted exactly ONCE for the whole
 * lifetime of this component (never remounted between hidden <-> open), so
 * IMA's attachment to them, and any audio it's already produced, is never
 * silently orphaned the way it was in the old implementation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Ltr } from "@/components/Bidi";
import AdsterraSlot from "./AdsterraSlot";

// Ad gate fires every 4th in-app "Next lesson" transition.
export const LESSONS_BETWEEN_VIDEO_ADS = 4;

const COUNTDOWN_SECONDS = 10;

// sessionStorage key is per-module so the "every Nth transition" counter
// resets at the start of every module instead of accumulating across the
// whole course (a module with 11 lessons and the next module with 7 lessons
// must each count 1,2,3,4,1,2,3,4... independently, starting from zero every
// time the student enters a new module).
const TRANSITION_KEY_PREFIX = "orbiet_lesson_transitions_";

// How long the OPEN modal will wait for the (already-prefetched) ad before
// giving up and showing the Adsterra fallback banner. Short on purpose: by
// the time the modal opens, the ad has usually had minutes to prepare in the
// background, so if it's still not ready within this window it's very
// unlikely to arrive soon (ad blocker, no-fill, dead VAST tag, etc.).
const OPEN_FALLBACK_TIMEOUT_MS = 2500;

// How long a prefetched-but-unused ad stays "fresh" before we discard it and
// request a new one instead. Guards against the VAST response effectively
// going stale if the student lingers on the lesson for a long time between
// reaching the end of the content and actually clicking "next".
const MAX_PREFETCH_AGE_MS = 5 * 60 * 1000; // 5 minutes

// Timeout (ms) IMA is given to fetch the VAST XML response itself. Raised
// above the SDK default (5s) because this now normally happens silently in
// the background while the student is still reading — there's no visible
// wait to protect, so it's worth giving a slower ad-server response more
// time to still result in a real ad instead of the banner.
const VAST_LOAD_TIMEOUT_MS = 8000;

const VAST_TAG_URL = process.env.NEXT_PUBLIC_HILLTOP_VAST_TAG_URL;
const FALLBACK_AD_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY_VIDEO;

/**
 * Read (without advancing) whether the NEXT in-app transition for this
 * module would show the video ad gate. Used to decide whether it's worth
 * prefetching at all once the student reaches the end of a lesson's content.
 * Safe to call repeatedly (e.g. from an IntersectionObserver) since it never
 * mutates the counter.
 */
export function peekShouldShowVideoAd(moduleId: string): boolean {
  if (typeof window === "undefined") return false;
  const prev = Number(sessionStorage.getItem(TRANSITION_KEY_PREFIX + moduleId) ?? "0");
  return (prev + 1) % LESSONS_BETWEEN_VIDEO_ADS === 0;
}

/**
 * Advance the per-module transition counter and return whether the gate
 * should show for THIS transition. Only ever called from the actual in-app
 * "Next lesson" click (never on load, never from the peek above).
 */
export function advanceAndShouldShowVideoAd(moduleId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = TRANSITION_KEY_PREFIX + moduleId;
  const prev = Number(sessionStorage.getItem(key) ?? "0");
  const next = prev + 1;
  sessionStorage.setItem(key, String(next));
  return next % LESSONS_BETWEEN_VIDEO_ADS === 0;
}

// ---------------------------------------------------------------------------
// Lazy IMA SDK script loader (module-level singleton promise so we only ever
// inject the <script> tag once, no matter how many times this component
// mounts across lessons).
// ---------------------------------------------------------------------------
let imaSdkPromise: Promise<void> | null = null;

function loadImaSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
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
      script.onerror = () => reject(new Error("IMA SDK failed to load"));
      document.head.appendChild(script);
    });
  }
  return imaSdkPromise;
}

// Off-screen box size used purely so IMA has real pixel dimensions to size
// the prefetched creative against before the modal is ever visible. It gets
// resized to the real, full-screen, per-device dimensions the moment the
// modal actually opens (see the "mode becomes open" effect below).
const PREFETCH_BOX_WIDTH = 480;
const PREFETCH_BOX_HEIGHT = 270;

type AdState =
  | "prefetching" // requestAds() in flight, creative not yet ready
  | "ready" // ADS_MANAGER_LOADED + LOADED fired, creative loaded & idle
  | "playing" // start() called, real ad is actually playing
  | "fallback"; // real ad unavailable/stale/errored -> Adsterra banner

export default function VideoAdModal({
  mode,
  onComplete,
}: {
  /** "hidden": prefetch silently, nothing shown. "open": full-screen modal. */
  mode: "hidden" | "open";
  /** Called when the countdown ends and the student taps to continue. */
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const [adState, setAdState] = useState<AdState>("prefetching");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const openFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const adsLoaderRef = useRef<any>(null);
  const adsManagerRef = useRef<any>(null);
  const readyAtRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const adStateRef = useRef<AdState>("prefetching");
  adStateRef.current = adState;

  const teardownAdsManager = useCallback(() => {
    try {
      adsManagerRef.current?.destroy();
    } catch {
      // already torn down or never fully initialized — ignore
    }
    adsManagerRef.current = null;
  }, []);

  const goToFallback = useCallback(() => {
    if (openFallbackTimerRef.current) {
      clearTimeout(openFallbackTimerRef.current);
      openFallbackTimerRef.current = null;
    }
    teardownAdsManager();
    readyAtRef.current = null;
    setAdState("fallback");
  }, [teardownAdsManager]);

  // Prepares (requestAds + init) the ad but NEVER calls start(). Actual
  // playback only ever happens from the "mode becomes open" effects below,
  // in direct response to the student's click on "Next lesson".
  const runPrefetchPipeline = useCallback(() => {
    if (!VAST_TAG_URL) {
      setAdState("fallback");
      return;
    }
    setAdState("prefetching");
    readyAtRef.current = null;

    loadImaSdk()
      .then(() => {
        if (cancelledRef.current) return;
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
            if (cancelledRef.current) return;
            const adsManager = e.getAdsManager(videoRef.current);
            adsManagerRef.current = adsManager;

            adsManager.addEventListener(ima.AdEvent.Type.LOADED, () => {
              if (cancelledRef.current) return;
              readyAtRef.current = Date.now();
              setAdState("ready");
            });
            adsManager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, goToFallback);
            adsManager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
              if (!cancelledRef.current) onCompleteRef.current();
            });

            try {
              const rect = boxRef.current?.getBoundingClientRect();
              const w = Math.round(rect?.width || PREFETCH_BOX_WIDTH);
              const h = Math.round(rect?.height || PREFETCH_BOX_HEIGHT);
              adsManager.init(w, h, ima.ViewMode.NORMAL);
            } catch {
              goToFallback();
            }
          }
        );

        adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, goToFallback);

        adDisplayContainer.initialize();

        const adsRequest = new ima.AdsRequest();
        adsRequest.adTagUrl = VAST_TAG_URL;
        adsRequest.vastLoadTimeout = VAST_LOAD_TIMEOUT_MS;
        const rect = boxRef.current?.getBoundingClientRect();
        adsRequest.linearAdSlotWidth = Math.round(rect?.width || PREFETCH_BOX_WIDTH);
        adsRequest.linearAdSlotHeight = Math.round(rect?.height || PREFETCH_BOX_HEIGHT);

        adsLoader.requestAds(adsRequest);
      })
      .catch(() => {
        if (!cancelledRef.current) goToFallback();
      });
  }, [goToFallback]);

  // Kept in a ref so the ALL_ADS_COMPLETED listener above (registered once,
  // inside a useCallback closure) always calls the latest onComplete.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ---- Kick off prefetch once, on mount. This component only ever mounts
  // when the parent (<LessonNav>) has already decided this transition is
  // worth prefetching for. ----
  useEffect(() => {
    cancelledRef.current = false;
    runPrefetchPipeline();

    return () => {
      cancelledRef.current = true;
      if (openFallbackTimerRef.current) clearTimeout(openFallbackTimerRef.current);
      openFallbackTimerRef.current = null;
      teardownAdsManager();
      try {
        adsLoaderRef.current?.destroy();
      } catch {
        // ignore
      }
      adsLoaderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resizeToBox = useCallback(() => {
    const ima = window.google?.ima;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!ima || !rect || !adsManagerRef.current) return;
    try {
      adsManagerRef.current.resize(
        Math.round(rect.width),
        Math.round(rect.height),
        ima.ViewMode.NORMAL
      );
    } catch {
      // ad may already have ended — ignore
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (openFallbackTimerRef.current) {
      clearTimeout(openFallbackTimerRef.current);
      openFallbackTimerRef.current = null;
    }
    try {
      resizeToBox();
      adsManagerRef.current.start();
      setAdState("playing");
    } catch {
      goToFallback();
    }
  }, [resizeToBox, goToFallback]);

  // ---- React to the modal actually opening (student clicked "Next") ----
  useEffect(() => {
    if (mode !== "open") return;

    const isFresh =
      adStateRef.current === "ready" &&
      readyAtRef.current !== null &&
      Date.now() - readyAtRef.current < MAX_PREFETCH_AGE_MS;

    if (isFresh && window.google?.ima && adsManagerRef.current && boxRef.current) {
      // Prefetched in time and still fresh — play immediately. This IS the
      // direct response to the click, so autoplay-with-sound is allowed.
      startPlayback();
      return;
    }

    if (adStateRef.current === "fallback") {
      return; // already known unavailable — banner is already showing
    }

    if (!isFresh && adStateRef.current === "ready") {
      // Stale: throw away the old one and request a fresh one under the
      // short timeout below, since the student is now actively waiting.
      teardownAdsManager();
      readyAtRef.current = null;
      cancelledRef.current = false;
      runPrefetchPipeline();
    }

    openFallbackTimerRef.current = setTimeout(goToFallback, OPEN_FALLBACK_TIMEOUT_MS);
    return () => {
      if (openFallbackTimerRef.current) {
        clearTimeout(openFallbackTimerRef.current);
        openFallbackTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // If the ad finishes prefetching WHILE the modal is already open (it was
  // still loading at click-time, and arrived within the short grace window)
  // — start it immediately.
  useEffect(() => {
    if (mode !== "open" || adState !== "ready") return;
    if (!window.google?.ima || !adsManagerRef.current || !boxRef.current) return;
    startPlayback();
  }, [mode, adState, startPlayback]);

  // ---- Countdown — only runs while the modal is actually open. The
  // "continue" control stays disabled/hidden until it reaches zero, same as
  // the skip-ad pattern used by video apps. ----
  useEffect(() => {
    if (mode !== "open") return;
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
  }, [mode]);

  // ---- Keep the ad sized to the full screen across resizes/orientation
  // changes (mobile rotation, browser chrome show/hide, etc.) while it's
  // actively playing. ----
  useEffect(() => {
    if (mode !== "open" || adState !== "playing") return;
    if (!boxRef.current) return;
    const observer = new ResizeObserver(resizeToBox);
    observer.observe(boxRef.current);
    window.addEventListener("orientationchange", resizeToBox);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", resizeToBox);
    };
  }, [mode, adState, resizeToBox]);

  const countdownDone = remaining === 0;
  const isOpen = mode === "open";

  return (
    <div
      className={
        isOpen
          ? "fixed inset-0 z-50 flex flex-col bg-black"
          : "pointer-events-none fixed opacity-0"
      }
      style={isOpen ? undefined : { top: -9999, left: -9999 }}
      role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? true : undefined}
      aria-label={isOpen ? "إعلان قصير قبل الدرس التالي" : undefined}
      aria-hidden={isOpen ? undefined : true}
    >
      {/* Fixed reserved box — the SAME <video>/adContainer nodes are used
          whether we're silently prefetching off-screen (small, fixed size)
          or actually showing the modal (full viewport on any device), so
          IMA's attachment to them is never disturbed by a remount. Only
          this box's own size/position (and the wrapper above) change. */}
      <div
        ref={boxRef}
        className={isOpen ? "relative w-full flex-1 overflow-hidden bg-black" : "relative overflow-hidden"}
        style={isOpen ? undefined : { width: PREFETCH_BOX_WIDTH, height: PREFETCH_BOX_HEIGHT }}
      >
        <div className="absolute inset-0" style={{ opacity: adState === "playing" ? 1 : 0 }}>
          <video ref={videoRef} className="h-full w-full object-contain" playsInline muted={false} />
          <div ref={adContainerRef} className="absolute inset-0" />
        </div>

        {isOpen && adState === "fallback" && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-navy">
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

        {isOpen && (adState === "prefetching" || adState === "ready") && (
          <div className="absolute inset-0 flex items-center justify-center text-space-muted">
            <span className="text-sm">جارٍ تجهيز الإعلان…</span>
          </div>
        )}

        {/* Top overlay: small unobtrusive label + live countdown, like the
            in-corner timers used by video apps. No close/skip control is
            rendered here at all while the countdown is running. */}
        {isOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">إعلان</span>
            {!countdownDone && (
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
                <Ltr className="font-mono">{remaining}</Ltr>
              </span>
            )}
          </div>
        )}

        {/* Bottom overlay: the ONLY way to proceed. It stays out of the way
            visually while the countdown runs and only becomes an actionable
            button once it hits zero — same pattern as "skip ad" buttons in
            every mainstream video app. */}
        {isOpen && countdownDone && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
            <button type="button" className="btn-primary" onClick={onComplete}>
              المتابعة إلى الدرس
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    google?: { ima?: any };
  }
}
