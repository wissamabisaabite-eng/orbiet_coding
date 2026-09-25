"use client";

/**
 * VIDEO AD FLOW (prefetch-ahead architecture)
 * ---------------------------------------------------------------------------
 * This component is mounted by <LessonNav> BEFORE the student ever clicks
 * "الدرس التالي" — as soon as the nav (= end of the lesson content) scrolls
 * into view AND the upcoming transition is one that should show the ad gate.
 * At that point it silently prefetches the DaoAds VAST creative in the
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
 * silently orphaned.
 *
 * FULL-SCREEN SIZING: the ad is requested/initialized at real viewport
 * dimensions from the very start (even while prefetching off-screen), not a
 * small fixed placeholder box — some VAST creatives render at a fixed pixel
 * size baked into the response and don't upscale cleanly later, which is
 * what caused the "tiny box in the corner" look. The video element itself
 * uses object-fit: cover so it always fills the full-screen container with
 * no letterboxing, on any device.
 *
 * HARD STOP ON "Continue": clicking the continue button explicitly stops
 * and destroys the ads manager and pauses/mutes the underlying <video>
 * BEFORE calling onComplete, so no ad audio/video can keep running in the
 * background after the student moves on to the next lesson.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Ltr } from "@/components/Bidi";
import AdsterraSlot from "./AdsterraSlot";

// Ad gate fires every 4th in-app "Next lesson" transition.
export const LESSONS_BETWEEN_VIDEO_ADS = 4;

const COUNTDOWN_SECONDS = 10;

// How long the OPEN modal will wait for the (already-prefetched) ad before
// giving up and showing the Adsterra fallback banner.
const OPEN_FALLBACK_TIMEOUT_MS = 20000;

// How long a prefetched-but-unused ad stays "fresh" before we discard it and
// request a new one instead.
const MAX_PREFETCH_AGE_MS = 5 * 60 * 1000; // 5 minutes

// Timeout (ms) IMA is given to fetch the VAST XML response itself.
const VAST_LOAD_TIMEOUT_MS = 10000;

const VAST_TAG_URL = process.env.NEXT_PUBLIC_DAOADS_VAST_TAG_URL;
const FALLBACK_AD_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY_VIDEO;

// Ad gate fires every 4th lesson, counted GLOBALLY and CONTINUOUSLY across
// the whole (flattened) course -- not reset per module. <LessonNav> computes
// the 1-based position of the current lesson in the whole-course flat list
// and passes it in directly, so this is a pure function with no counter to
// keep in sync in storage.
export function shouldShowVideoAd(globalLessonIndex: number): boolean {
  return globalLessonIndex % LESSONS_BETWEEN_VIDEO_ADS === 0;
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

// Fallback size only used in the rare case window is unavailable when we
// need a number (SSR guard) -- in practice the real viewport size is always
// used instead, see getFullScreenSize() below.
const SIZE_FALLBACK_WIDTH = 1280;
const SIZE_FALLBACK_HEIGHT = 720;

/** Real, current full-screen size to request/init/size the ad at -- used
 * even while prefetching off-screen, so the creative is never requested at
 * a small placeholder size that some VAST responses can't upscale from. */
function getFullScreenSize(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: SIZE_FALLBACK_WIDTH, height: SIZE_FALLBACK_HEIGHT };
  }
  return {
    width: window.innerWidth || SIZE_FALLBACK_WIDTH,
    height: window.innerHeight || SIZE_FALLBACK_HEIGHT,
  };
}

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
      adsManagerRef.current?.stop?.();
    } catch {
      // ignore
    }
    try {
      adsManagerRef.current?.destroy();
    } catch {
      // already torn down or never fully initialized — ignore
    }
    adsManagerRef.current = null;
  }, []);

  // Fully stops any playing/loaded ad: destroys the ads manager AND
  // explicitly pauses + mutes + resets the underlying <video> element, so no
  // audio/video can keep running in the background under any circumstance
  // (including edge cases where the ad SDK's own stop() doesn't immediately
  // silence an in-flight audio track).
  const hardStopAd = useCallback(() => {
    teardownAdsManager();
    try {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = true;
        videoRef.current.currentTime = 0;
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      }
    } catch {
      // ignore
    }
  }, [teardownAdsManager]);

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
              // Init at real full-screen size from the start (see
              // getFullScreenSize() note above) so the creative renders
              // full-bleed instead of a small fixed box.
              const { width, height } = getFullScreenSize();
              adsManager.init(width, height, ima.ViewMode.NORMAL);
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
        const { width, height } = getFullScreenSize();
        adsRequest.linearAdSlotWidth = width;
        adsRequest.linearAdSlotHeight = height;

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

  // ---- Kick off prefetch once, on mount. ----
  useEffect(() => {
    cancelledRef.current = false;
    runPrefetchPipeline();

    return () => {
      cancelledRef.current = true;
      if (openFallbackTimerRef.current) clearTimeout(openFallbackTimerRef.current);
      openFallbackTimerRef.current = null;
      hardStopAd();
      try {
        adsLoaderRef.current?.destroy();
      } catch {
        // ignore
      }
      adsLoaderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resizeToFullScreen = useCallback(() => {
    const ima = window.google?.ima;
    if (!ima || !adsManagerRef.current) return;
    const { width, height } = getFullScreenSize();
    try {
      adsManagerRef.current.resize(width, height, ima.ViewMode.NORMAL);
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
      resizeToFullScreen();
      adsManagerRef.current.start();
      setAdState("playing");
    } catch {
      goToFallback();
    }
  }, [resizeToFullScreen, goToFallback]);

  // ---- React to the modal actually opening (student clicked "Next") ----
  useEffect(() => {
    if (mode !== "open") return;

    const isFresh =
      adStateRef.current === "ready" &&
      readyAtRef.current !== null &&
      Date.now() - readyAtRef.current < MAX_PREFETCH_AGE_MS;

    if (isFresh && window.google?.ima && adsManagerRef.current) {
      // Prefetched in time and still fresh — play immediately.
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
  // still loading at click-time, and arrived within the grace window) —
  // start it immediately.
  useEffect(() => {
    if (mode !== "open" || adState !== "ready") return;
    if (!window.google?.ima || !adsManagerRef.current) return;
    startPlayback();
  }, [mode, adState, startPlayback]);

  // ---- Countdown — only runs while the modal is actually open. The
  // "continue" control stays disabled/hidden until it reaches zero -- this
  // is what delays the (custom, our own) skip/continue control, separate
  // from any native skip button the ad creative itself might render. ----
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
  // changes while it's actively playing. ----
  useEffect(() => {
    if (mode !== "open" || adState !== "playing") return;
    window.addEventListener("resize", resizeToFullScreen);
    window.addEventListener("orientationchange", resizeToFullScreen);
    return () => {
      window.removeEventListener("resize", resizeToFullScreen);
      window.removeEventListener("orientationchange", resizeToFullScreen);
    };
  }, [mode, adState, resizeToFullScreen]);

  // Explicit "continue" handler: HARD-stops the ad (destroys the ads
  // manager, pauses/mutes/resets the <video>) BEFORE telling the parent to
  // move on, so nothing can keep playing/making sound in the background.
  const handleContinue = useCallback(() => {
    hardStopAd();
    onComplete();
  }, [hardStopAd, onComplete]);

  const countdownDone = remaining === 0;
  const isOpen = mode === "open";

  return (
    <div
      className={
        isOpen
          ? "fixed inset-0 z-50 flex flex-col bg-black"
          : "pointer-events-none fixed opacity-0"
      }
      style={isOpen ? undefined : { top: -9999, left: -9999, width: 1, height: 1 }}
      role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? true : undefined}
      aria-label={isOpen ? "إعلان قصير قبل الدرس التالي" : undefined}
      aria-hidden={isOpen ? undefined : true}
    >
      {/* Fixed reserved box — the SAME <video>/adContainer nodes are used
          whether we're silently prefetching off-screen or actually showing
          the modal (full viewport on any device), so IMA's attachment to
          them is never disturbed by a remount. */}
      <div
        ref={boxRef}
        className={isOpen ? "relative w-full flex-1 overflow-hidden bg-black" : "relative overflow-hidden"}
        style={isOpen ? undefined : { width: 1, height: 1 }}
      >
        <div className="absolute inset-0" style={{ opacity: adState === "playing" ? 1 : 0 }}>
          {/* object-cover: the ad always fills the full-screen container
              edge-to-edge with no letterboxing, on any device. */}
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted={false} />
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

        {/* Top overlay: small unobtrusive label + live countdown. No
            close/skip control is rendered here at all while the countdown
            is running. */}
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
            button once it hits zero. Clicking it hard-stops the ad (no
            lingering audio) before moving to the next lesson. */}
        {isOpen && countdownDone && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
            <button type="button" className="btn-primary" onClick={handleContinue}>
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