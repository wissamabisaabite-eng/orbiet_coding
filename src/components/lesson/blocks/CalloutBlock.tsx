import type { CalloutVariant } from "@/types";
import { Isolate } from "@/components/Bidi";

const ICONS: Record<CalloutVariant, string> = {
  note: "💡",
  tip: "📌",
  warning: "⚠️",
  danger: "🔴",
  summary: "📋",
  best_practice: "🏆",
};

/**
 * "صندوق ملاحظة" — the admin's note-box block. Six color variants matching
 * the .callout-* classes defined in globals.css (copied from the html-lesson
 * reference 1:1).
 */
export default function CalloutBlock({
  variant,
  text,
}: {
  variant: CalloutVariant;
  text: string;
}) {
  return (
    <div className={`callout callout-${variant} my-5`}>
      <span className="callout-icon" aria-hidden="true">
        {ICONS[variant] ?? "💡"}
      </span>
      <div className="callout-content">
        <p>
          <Isolate>{text}</Isolate>
        </p>
      </div>
    </div>
  );
}
