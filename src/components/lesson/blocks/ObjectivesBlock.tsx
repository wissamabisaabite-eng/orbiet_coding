import { Isolate } from "@/components/Bidi";

/** "أهداف الدرس" — lesson objectives block. */
export default function ObjectivesBlock({
  title,
  items,
}: {
  title?: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="objectives-block my-5">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
        <span aria-hidden="true" className="text-orbit-cyan">
          🎯
        </span>
        {title || "أهداف الدرس"}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-space-muted">
            <span aria-hidden="true" className="mt-0.5 text-nebula-green">
              ✓
            </span>
            <span>
              <Isolate>{item}</Isolate>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
