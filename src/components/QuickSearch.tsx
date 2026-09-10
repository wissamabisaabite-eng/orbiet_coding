"use client";

/**
 * Global quick search: opens with Ctrl/Cmd+K (or a tap on the header search
 * button, for touch devices without a keyboard) and filters courses/lessons
 * client-side against a lightweight index fetched once from
 * /api/search-index and cached in memory for the rest of the session.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchEntry } from "@/app/api/search-index/route";

export default function QuickSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl/Cmd+K opens, Escape closes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch the search index lazily, only on first open, then reuse it.
  useEffect(() => {
    if (!open || index !== null) return;
    setLoading(true);
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => setIndex(data))
      .catch(() => setIndex([]))
      .finally(() => setLoading(false));
  }, [open, index]);

  useEffect(() => {
    if (open) {
      // Focus after the dialog paints.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    } else {
      setQuery("");
    }
  }, [open]);

  const results = (index ?? []).filter((entry) => {
    if (!query.trim()) return false;
    const q = query.trim().toLowerCase();
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.courseTitle.toLowerCase().includes(q)
    );
  });

  const go = (entry: SearchEntry) => {
    setOpen(false);
    if (entry.type === "course") {
      router.push(`/courses/${entry.courseId}`);
    } else {
      router.push(`/courses/${entry.courseId}/lessons/${entry.id}`);
    }
  };

  return (
    <>
      {/* Header trigger — useful on touch devices without a keyboard shortcut. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
        aria-label="بحث سريع"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">بحث</span>
        <span className="hidden rounded border border-orbit-blue/30 px-1.5 py-0.5 font-mono text-[10px] text-space-muted sm:inline">
          Ctrl K
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-space-navy/70 px-4 pt-[12vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="بحث سريع"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-orbit-blue/25 bg-space-navy-800 shadow-orbit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-orbit-blue/15 px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-space-muted">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن دورة أو درس…"
                className="w-full bg-transparent text-space-ink placeholder:text-space-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-space-muted hover:text-space-ink"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading && (
                <p className="px-3 py-4 text-center text-sm text-space-muted">
                  جارِ التحميل…
                </p>
              )}

              {!loading && query.trim() && results.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-space-muted">
                  لا نتائج لـ «{query}».
                </p>
              )}

              {!loading && !query.trim() && (
                <p className="px-3 py-4 text-center text-sm text-space-muted">
                  اكتب اسم دورة أو درس للبحث عنه.
                </p>
              )}

              {results.slice(0, 20).map((entry) => (
                <button
                  key={`${entry.type}-${entry.id}`}
                  type="button"
                  onClick={() => go(entry)}
                  className="flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-orbit-blue/10"
                >
                  <span className="text-sm text-space-ink">{entry.title}</span>
                  <span className="text-xs text-orbit-cyan">
                    {entry.type === "course" ? "دورة" : `درس · ${entry.courseTitle}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}