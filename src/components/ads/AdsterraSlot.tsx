"use client";

/**
 * Low-level Adsterra "Banner" ad-unit renderer.
 *
 * WHY AN IFRAME, AND WHY NOT dangerouslySetInnerHTML:
 *  - React's dangerouslySetInnerHTML never executes injected <script> tags —
 *    the browser parses them as inert markup. That is almost certainly why a
 *    previous attempt at "injecting" the Adsterra snippet did nothing.
 *  - Adsterra's banner snippet is two <script> tags: one that sets a GLOBAL
 *    `atOptions` object, and one that loads `invoke.js`, which reads that
 *    global synchronously. If two banners exist on the same page, the second
 *    `atOptions` overwrites the first before its invoke.js runs.
 *  - The fix used across real Adsterra + React/Next integrations: build each
 *    ad unit inside its OWN <iframe>, and write the two script tags into that
 *    iframe's own document via `document.write`. Each iframe gets its own
 *    `window`, so `atOptions` never collides between slots, and the scripts
 *    are real <script> elements the iframe's browsing context executes.
 *
 * This is a genuine page component (rendered by React, sized by React,
 * unmounted by React) — not a runtime DOM hack bolted onto the page.
 */
export default function AdsterraSlot({
  adKey,
  width,
  height,
  className = "",
}: {
  /** The Adsterra ad-unit key (from the Adsterra publisher dashboard). */
  adKey: string;
  width: number;
  height: number;
  className?: string;
}) {
  // No key configured yet (env var missing) — render nothing rather than a
  // broken/empty ad frame.
  if (!adKey) return null;

  const doc = `<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>
<script>
  atOptions = {
    key: ${JSON.stringify(adKey)},
    format: 'iframe',
    height: ${height},
    width: ${width},
    params: {}
  };
</script>
<script src="https://www.highrevenueformat.com/${adKey}/invoke.js"></script>
</body></html>`;

  return (
    <iframe
      title="إعلان"
      srcDoc={doc}
      width={width}
      height={height}
      style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
      scrolling="no"
      className={className}
      loading="lazy"
    />
  );
}
