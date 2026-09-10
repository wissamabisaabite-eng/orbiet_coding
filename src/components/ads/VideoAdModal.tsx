"use client";

/**
 * Mandatory ~10-second video-ad gate shown BETWEEN lessons.
 *
 * ملاحظة (بالعربية): هذا هو إعلان الفيديو الإلزامي بين الدروس. لا نُشغّل سكربت
 * إعلان Adsterra الحقيقي في بيئة المعاينة؛ نعرض فقط عنصرًا نائبًا بحجم ثابت مع
 * عدّاد تنازلي هادئ. زر "تخطّي" قد يظهر بعد انتهاء العدّاد فقط، وقد لا يظهر
 * إطلاقًا حسب نوع وحدة إعلان الفيديو في Adsterra.
 *
 * ENGLISH: Placeholder for an Adsterra video ad unit. No real script runs in
 * preview. The overlay shows a calm, non-flashing countdown; the Skip button
 * appears only AFTER the countdown finishes — and depending on which Adsterra
 * video product is used, a Skip option may not be available at all.
 *
 * FREQUENCY: This does not show on every navigation. It shows once every
 * LESSONS_BETWEEN_VIDEO_ADS in-app "Next lesson" transitions, tracked via a
 * sessionStorage counter. It must NEVER appear on first site visit or when a
 * lesson is opened directly (external link / refresh) — only on in-app
 * next-lesson navigation. See LessonNav for how the trigger is wired.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Ltr } from "@/components/Bidi";
import AdsterraSlot from "./AdsterraSlot";

// Adjust ad frequency here (show the video every Nth lesson transition).
export const LESSONS_BETWEEN_VIDEO_ADS = 3;

const COUNTDOWN_SECONDS = 10;
const TRANSITION_KEY = "orbiet_lesson_transitions";

/**
 * Adsterra does not expose a self-hosted "video player with a custom
 * countdown" API for third-party sites — their video product is delivered as
 * its own ad unit (banner/native "video" creative), not a controllable
 * <video> element. So the mandatory watch-time is enforced HERE (by us, via
 * the countdown below) while the creative itself comes from a real Adsterra
 * unit rendered inside the reserved 16:9 box.
 *
 * Set this once you create a "Video"/native ad unit in the Adsterra
 * dashboard for this placement.
 */
const VIDEO_AD_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY_VIDEO;

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

export default function VideoAdModal({
  open,
  onComplete,
}: {
  open: boolean;
  /** Called when the countdown ends or Skip is pressed — completes navigation. */
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    onComplete();
  }, [onComplete]);

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
        {/* Mixed Arabic + emoji heading, rendered per the bidi rules. */}
        <h2 className="mb-4 text-xl font-bold text-space-ink">
          استراحة قصيرة قبل الدرس التالي <span aria-hidden="true">🚀</span>
        </h2>

        {/* Fixed-size reserved video placeholder (16:9) to avoid layout shift. */}
        <div className="relative mx-auto mb-5 w-full max-w-xl overflow-hidden rounded-xl border border-orbit-blue/25 bg-space-navy-800">
          <div style={{ paddingTop: "56.25%" }} />
          {VIDEO_AD_KEY ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <AdsterraSlot adKey={VIDEO_AD_KEY} width={480} height={270} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-space-muted">
              <span className="text-sm" dir="ltr">
                Set NEXT_PUBLIC_ADSTERRA_KEY_VIDEO
              </span>
            </div>
          )}
        </div>

        {/* Calm, non-flashing countdown. */}
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

        {/*
         * Skip appears ONLY after the countdown finishes. Note: depending on the
         * Adsterra video product, a skip option may not be offered at all — in
         * that case this button would be removed and onComplete() called
         * automatically when the ad unit signals completion.
         */}
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
