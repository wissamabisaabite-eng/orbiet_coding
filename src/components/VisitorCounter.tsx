"use client";

/**
 * Site-wide visitor counter ("eye" icon), shown in the footer of every page.
 *
 * ONE global counter for the whole site — not per-page, not per-lesson. It
 * lives in a dedicated collection, completely separate from courses/**:
 *
 *     siteStats/visitorCount  ->  { count: number }
 *
 * ---------------------------------------------------------------------------
 * SPARK-PLAN FALLBACK (flagged):
 * Ideally this increment would go through a small Cloud Function (callable or
 * HTTPS), because a direct client-side increment() can be spammed by anyone
 * who inspects the network request and replays it; a Cloud Function lets you
 * rate-limit / validate server-side. On the free Spark plan there are no Cloud
 * Functions, so we do a direct client write, guarded by tightly scoped
 * security rules that ONLY allow count -> count + 1 (see firestore.rules.proposed).
 * To upgrade later: replace the incrementVisitor() body with an httpsCallable call.
 * ---------------------------------------------------------------------------
 *
 * De-dupe: increment at most once per browser SESSION (sessionStorage flag), so
 * reloads within the same session don't double-count. This runs regardless of
 * which page the visitor lands on first, so it reflects total site traffic.
 */
import { useEffect, useState } from "react";
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { compactNumber } from "@/lib/format";
import { Ltr } from "@/components/Bidi";

const SESSION_FLAG = "orbiet_visit_counted";
const STATS_DOC = ["siteStats", "visitorCount"] as const;

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const db = getDb();
      const ref = doc(db, STATS_DOC[0], STATS_DOC[1]);

      try {
        const alreadyCounted = sessionStorage.getItem(SESSION_FLAG) === "1";

        if (!alreadyCounted) {
          // Direct client increment (Spark fallback). Rules must enforce +1 only.
          await updateDoc(ref, { count: increment(1) });
          sessionStorage.setItem(SESSION_FLAG, "1");
        }

        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) {
          const value = snap.data().count;
          setCount(typeof value === "number" ? value : 0);
        }
      } catch {
        // Counter is non-critical; fail silently so it never blocks the page.
        // (e.g. the siteStats doc doesn't exist yet, or rules reject the write.)
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 text-space-muted"
      title="عدد زوّار الموقع"
    >
      <EyeIcon />
      {/* Numbers stay LTR even inside RTL text (bidi rule, section 2). */}
      <Ltr className="tabular-nums font-mono text-sm text-space-ink">
        {count === null ? "—" : compactNumber(count)}
      </Ltr>
    </span>
  );
}

/** Single-tone eye with a subtle gold pupil — not cartoonish. */
function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-orbit-cyan"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.75" fill="#F5C24C" />
    </svg>
  );
}
