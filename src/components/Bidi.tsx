/**
 * ====================================================================
 * BIDI SAFETY HELPERS — do not remove. See the note in app/layout.tsx.
 * ====================================================================
 *
 * The site is Arabic (RTL) but nearly every sentence embeds inline Latin
 * text or code identifiers (e.g. "استخدم useState هنا"). Without isolation,
 * the Unicode bidirectional algorithm can reorder/reverse those Latin runs,
 * punctuation, and multi-digit numbers.
 *
 * <Ltr>   — isolates a run and forces LTR (English terms, code identifiers,
 *           acronyms, numbers). Renders a real <bdi dir="ltr">.
 * <Isolate> — isolates a run but lets the browser auto-detect its direction
 *           (unicode-bidi: isolate via <bdi>), for mixed unknown content.
 *
 * These render as inline elements and can sit inside Arabic paragraphs,
 * headings, buttons, etc.
 */
import type { ReactNode } from "react";

export function Ltr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={className} style={{ unicodeBidi: "isolate" }}>
      {children}
    </bdi>
  );
}

export function Isolate({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // <bdi> defaults to dir="auto": isolates and auto-detects direction.
  return <bdi className={className}>{children}</bdi>;
}
