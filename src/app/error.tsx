"use client";

/**
 * Root error boundary. Catches thrown errors from any Server Component page
 * below it — including TimeoutError from lib/withTimeout.ts when a Firestore
 * call hangs — so the visitor gets a clear "connection issue, try again"
 * screen instead of waiting forever or seeing a raw crash page.
 */
import { useEffect } from "react";
import Planet from "@/components/space/Planet";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isTimeout = error?.name === "TimeoutError";

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
      <Planet seed="connection-error" size={90} float className="mb-6" />
      <h1 className="mb-3 text-2xl font-bold text-white">
        {isTimeout ? "انقطع الاتصال بالمحطة" : "حدث خطأ غير متوقع"}
      </h1>
      <p className="mb-8 max-w-md text-space-muted">
        {isTimeout
          ? "استغرق الاتصال وقتًا أطول من المعتاد. تحقق من اتصالك بالإنترنت وأعد المحاولة."
          : "واجهنا مشكلة أثناء تحميل هذه الصفحة. حاول مرة أخرى."}
      </p>
      <button type="button" onClick={() => reset()} className="btn-primary">
        أعد المحاولة
      </button>
    </div>
  );
}