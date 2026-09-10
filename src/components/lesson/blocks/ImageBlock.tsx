import Image from "next/image";

/**
 * Lesson image / output image. Uses next/image for Firebase Storage URLs.
 * `output_image` (e.g. a program's rendered output) gets a subtle label.
 */
export default function ImageBlock({
  url,
  caption,
  isOutput = false,
}: {
  url: string;
  caption?: string;
  isOutput?: boolean;
}) {
  return (
    <figure className="my-5">
      <div className="image-block relative mx-auto bg-space-navy-800">
        {/* Unknown intrinsic size: use a responsive wrapper with auto height. */}
        <Image
          src={url}
          alt={caption ?? (isOutput ? "مخرجات الكود" : "صورة توضيحية")}
          width={1200}
          height={800}
          sizes="(max-width: 768px) 100vw, 720px"
          className="h-auto w-full object-contain"
        />
      </div>
      {(caption || isOutput) && (
        <figcaption className="mt-2 text-center text-sm text-space-muted">
          {isOutput && <span className="me-1 text-orbit-gold">◆ المخرجات:</span>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
