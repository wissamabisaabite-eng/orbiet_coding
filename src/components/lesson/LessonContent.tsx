import type { Lesson } from "@/types";
import RichTextBlock from "./blocks/RichTextBlock";
import CodeBlock from "./blocks/CodeBlock";
import ImageBlock from "./blocks/ImageBlock";
import CalloutBlock from "./blocks/CalloutBlock";
import TerminalBlock from "./blocks/TerminalBlock";
import ObjectivesBlock from "./blocks/ObjectivesBlock";
import StepsBlock from "./blocks/StepsBlock";
import HtmlLesson from "./HtmlLesson";

/**
 * Dispatches lesson rendering on contentType.
 *   - "html":   sandboxed iframe (HtmlLesson).
 *   - "blocks": render each content_blocks item in order.
 *
 * NOTE: No ad banners are ever inserted between content blocks — that would
 * break the reading/learning flow (section 6).
 */
export default function LessonContent({
  lesson,
  fullBleedHtml = false,
}: {
  lesson: Lesson;
  /** When the lesson is an "html" lesson, render it full-bleed/full-height. */
  fullBleedHtml?: boolean;
}) {
  if (lesson.contentType === "html") {
    return (
      <HtmlLesson
        htmlContent={lesson.htmlContent}
        htmlUrl={lesson.htmlUrl}
        fullBleed={fullBleedHtml}
      />
    );
  }

  const blocks = lesson.content_blocks ?? [];
  if (blocks.length === 0) {
    return <p className="text-space-muted">لا يوجد محتوى في هذا الدرس بعد.</p>;
  }

  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "richText":
            return <RichTextBlock key={i} delta={block.delta} />;
          case "code":
            return <CodeBlock key={i} code={block.code} language={block.language} />;
          case "image":
            return <ImageBlock key={i} url={block.url} caption={block.caption} />;
          case "output_image":
            return <ImageBlock key={i} url={block.url} caption={block.caption} isOutput />;
          case "callout":
            return <CalloutBlock key={i} variant={block.variant} text={block.text} />;
          case "terminal":
            return <TerminalBlock key={i} command={block.command} output={block.output} />;
          case "objectives":
            return <ObjectivesBlock key={i} title={block.title} items={block.items} />;
          case "steps":
            return <StepsBlock key={i} items={block.items} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
