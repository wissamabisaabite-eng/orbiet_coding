"use client";

/**
 * Previous / Next lesson navigation. Traverses the WHOLE course (the flattened
 * lesson list across all modules in order), not just the current module.
 *
 * The "Next lesson" click may be gated by the mandatory video ad:
 *   - We do NOT navigate immediately. shouldShowVideoAd() decides (every Nth
 *     in-app transition) whether to show the overlay first.
 *   - The gate only ever triggers on this in-app click — never on first visit
 *     or when a lesson is opened directly (this component only runs after the
 *     user is already on a lesson and clicks Next).
 *   - When the overlay completes (countdown ends / skip), we perform the
 *     actual navigation.
 *
 * "Previous" is never gated.
 *
 * Directional icons: under RTL, "next" points to the LEFT and "previous" to the
 * RIGHT. We use logical labels and let the arrow glyphs match the RTL reading
 * direction.
 */
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { FlatLesson } from "@/types";
import { shouldShowVideoAd } from "@/components/ads/VideoAdModal";
import { Isolate } from "@/components/Bidi";

// Lazy-load the modal: not needed until the user actually clicks Next.
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

  const index = flat.findIndex((l) => l.id === currentLessonId);
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index >= 0 && index < flat.length - 1 ? flat[index + 1] : null;

  const hrefFor = (l: FlatLesson) => `/courses/${courseId}/lessons/${l.id}`;

  const goNext = useCallback(() => {
    if (!next) return;
    router.push(hrefFor(next));
  }, [next, router, courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNextClick = useCallback(() => {
    if (!next) return;
    // Decide + advance the transition counter. Show the ad only every Nth time.
    if (shouldShowVideoAd()) {
      setAdOpen(true);
    } else {
      goNext();
    }
  }, [next, goNext]);

  const onAdComplete = useCallback(() => {
    setAdOpen(false);
    goNext();
  }, [goNext]);

  return (
    <>
      <nav className="mt-10 flex items-center justify-between gap-3 border-t border-orbit-blue/15 pt-6">
        {/* Previous (points to the right under RTL). */}
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

        {/* Next (points to the left under RTL). Gated by the video ad. */}
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

      <VideoAdModal open={adOpen} onComplete={onAdComplete} />
    </>
  );
}
