"use client";

/**
 * Prev/Next navigation across the whole (flattened) course.
 *
 * "Next lesson" is gated by the video ad every LESSONS_BETWEEN_VIDEO_ADS
 * in-app transitions — counted PER MODULE (see VideoAdModal.tsx), so the
 * count restarts at 1 whenever the student enters a new module, instead of
 * accumulating across the whole course.
 *
 * We do NOT navigate immediately. advanceAndShouldShowVideoAd() decides
 * (every Nth transition) whether to show the ad modal first; navigation
 * itself only happens once the modal calls onComplete (or immediately, if
 * this transition doesn't gate on an ad at all).
 *
 * To avoid the ad ever starting audio/video while the student is still
 * reading, the ad is only ever *prefetched* (never played) as soon as this
 * nav — which sits right at the end of the lesson's content — scrolls into
 * view, and only if the upcoming transition would actually show the gate.
 * Playback itself is only triggered once the student actually clicks
 * "Next" (see VideoAdModal.tsx for the full explanation).
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { FlatLesson } from "@/types";
import {
  peekShouldShowVideoAd,
  advanceAndShouldShowVideoAd,
} from "@/components/ads/VideoAdModal";
import { Isolate } from "@/components/Bidi";

const VideoAdModal = dynamic(() => import("@/components/ads/VideoAdModal"), {
  ssr: false,
});

export default function LessonNav({
  courseId,
  flat,
  currentLessonId,
}: {
  courseId: string;
  flat: FlatLesson[];
  currentLessonId: string;
}) {
  const router = useRouter();
  const [adOpen, setAdOpen] = useState(false);
  const [prefetchArmed, setPrefetchArmed] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const index = flat.findIndex((l) => l.id === currentLessonId);
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index >= 0 && index < flat.length - 1 ? flat[index + 1] : null;
  const currentModuleId = index >= 0 ? flat[index].moduleId : null;

  const hrefFor = (l: FlatLesson) => `/courses/${courseId}/lessons/${l.id}`;

  // Once this nav (= end of the lesson content) scrolls into view, arm the
  // ad prefetch — but only if leaving the CURRENT lesson's module on this
  // transition would actually show the gate. peekShouldShowVideoAd never
  // mutates the counter, so it's safe to check repeatedly.
  useEffect(() => {
    if (prefetchArmed || !currentModuleId || !next) return;
    const el = navRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && peekShouldShowVideoAd(currentModuleId)) {
          setPrefetchArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [prefetchArmed, currentModuleId, next]);

  const goNext = useCallback(() => {
    if (!next) return;
    router.push(hrefFor(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, router, courseId]);

  const onNextClick = useCallback(() => {
    if (!next || !currentModuleId) return;
    if (advanceAndShouldShowVideoAd(currentModuleId)) {
      setAdOpen(true);
    } else {
      goNext();
    }
  }, [next, currentModuleId, goNext]);

  const onAdComplete = useCallback(() => {
    setAdOpen(false);
    goNext();
  }, [goNext]);

  return (
    <>
      <nav
        ref={navRef}
        className="mt-10 flex items-center justify-between gap-3 border-t border-orbit-blue/15 pt-6"
      >
        {prev ? (
          <button
            type="button"
            onClick={() => router.push(hrefFor(prev))}
            className="btn-ghost flex items-center gap-2 text-start"
          >
            <span aria-hidden="true">→</span>
            <span className="flex flex-col">
              <span className="text-xs text-space-muted">الدرس السابق</span>
              <span className="line-clamp-1 text-sm">
                <Isolate>{prev.title}</Isolate>
              </span>
            </span>
          </button>
        ) : (
          <span />
        )}

        {next ? (
          <button
            type="button"
            onClick={onNextClick}
            className="btn-primary flex items-center gap-2 text-start"
          >
            <span className="flex flex-col">
              <span className="text-xs opacity-80">الدرس التالي</span>
              <span className="line-clamp-1 text-sm">
                <Isolate>{next.title}</Isolate>
              </span>
            </span>
            <span aria-hidden="true">←</span>
          </button>
        ) : (
          <span />
        )}
      </nav>

      {/* Mounted only once prefetch is armed (i.e. this transition will
          actually gate on an ad) — the component itself starts preparing
          the ad silently the moment it mounts, per VideoAdModal.tsx. */}
      {prefetchArmed && (
        <VideoAdModal mode={adOpen ? "open" : "hidden"} onComplete={onAdComplete} />
      )}
    </>
  );
}
