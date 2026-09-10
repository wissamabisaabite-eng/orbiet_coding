/**
 * Renders an `html` lesson inside a SANDBOXED <iframe> (via HtmlLessonFrame)
 * so its styles/scripts are isolated from the rest of the Orbiet page (they
 * can't leak CSS or grab the parent DOM).
 *
 * Data source:
 *   - htmlContent: injected via srcDoc.
 *   - htmlUrl:     fetched server-side (this is a Server Component) and then
 *                  injected via srcDoc too, so the same isolation applies.
 *
 * The actual <iframe> + fullscreen toggle button live in HtmlLessonFrame
 * (client component), since fullscreen state needs interactivity.
 */
import HtmlLessonFrame from "./HtmlLessonFrame";

export default async function HtmlLesson({
  htmlContent,
  htmlUrl,
  fullBleed = false,
}: {
  htmlContent?: string;
  htmlUrl?: string;
  /** Fill the whole viewport width/height (used on the dedicated lesson page)
   *  instead of sitting inside the reading column at a fixed 70vh. */
  fullBleed?: boolean;
}) {
  let html = htmlContent ?? "";

  if (!html && htmlUrl) {
    try {
      const res = await fetch(htmlUrl, { next: { revalidate: 300 } });
      if (res.ok) html = await res.text();
    } catch {
      html = "";
    }
  }

  if (!html) {
    return (
      <p className="rounded-lg border border-orbit-gold/30 bg-space-navy-800 p-4 text-space-muted">
        تعذّر تحميل محتوى هذا الدرس.
      </p>
    );
  }

  if (fullBleed) {
    return <HtmlLessonFrame html={html} fullBleed />;
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-orbit-blue/20 bg-white">
      <HtmlLessonFrame html={html} />
    </div>
  );
}
