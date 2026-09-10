"use client";

/**
 * Small client button for connection-error/timeout states in Server
 * Components: refetches the current route's server data instead of a full
 * hard reload, so the rest of the page (starfield, header, etc.) doesn't flash.
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RetryButton({ label = "أعد المحاولة" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attempted, setAttempted] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setAttempted(true);
        startTransition(() => router.refresh());
      }}
      disabled={isPending}
      className="btn-primary disabled:opacity-60"
    >
      {isPending ? "جارِ إعادة الاتصال…" : attempted ? "حاول مجددًا" : label}
    </button>
  );
}