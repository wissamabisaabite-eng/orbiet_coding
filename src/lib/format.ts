/**
 * Formatting helpers. Numbers use Western digits (0-9) for consistency with
 * code/technical content. Callers should still wrap output in <bdi dir="ltr">
 * (see components/Bidi.tsx) so multi-digit numbers keep LTR order inside RTL text.
 */

/** 12400 -> "12.4K", 1500000 -> "1.5M". Leaves values < 1000 as-is. */
export function compactNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n < 1000) return String(n);

  const units = [
    { v: 1_000_000_000, s: "B" },
    { v: 1_000_000, s: "M" },
    { v: 1_000, s: "K" },
  ];
  for (const { v, s } of units) {
    if (n >= v) {
      const scaled = n / v;
      // One decimal, but drop a trailing ".0".
      const text = scaled >= 100 ? Math.round(scaled).toString() : scaled.toFixed(1).replace(/\.0$/, "");
      return `${text}${s}`;
    }
  }
  return String(n);
}
