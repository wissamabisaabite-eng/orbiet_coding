import { Isolate, Ltr } from "@/components/Bidi";

// Arabic-Indic digits, matching the numbering style used in the admin's html
// lessons (step-number shows ١ ٢ ٣ ...).
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toArabicDigits(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join("");
}

/** "خطوات مرقّمة" — numbered steps block. */
export default function StepsBlock({
  items,
}: {
  items: { title: string; text: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="my-5">
      {items.map((step, i) => (
        <div className="step-item" key={i}>
          <div className="step-number">
            <Ltr>{toArabicDigits(i + 1)}</Ltr>
          </div>
          <div className="flex-1 pt-1">
            <h4 className="mb-1 font-semibold text-space-ink">
              <Isolate>{step.title}</Isolate>
            </h4>
            <p className="text-space-muted">
              <Isolate>{step.text}</Isolate>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
