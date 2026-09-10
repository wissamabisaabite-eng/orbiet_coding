import { notFound } from "next/navigation";
import Link from "next/link";
import ModuleAccordion from "@/components/ModuleAccordion";
import { getCourse, getLessons, getModules } from "@/lib/firestore";
import { Isolate } from "@/components/Bidi";
import Planet from "@/components/space/Planet";
import { withTimeout } from "@/lib/withTimeout";

export const revalidate = 300;

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  // Fail fast after 8s instead of hanging — src/app/error.tsx shows a
  // themed "connection issue, try again" screen for the resulting error.
  const course = await withTimeout(getCourse(courseId), 8000);
  if (!course) notFound();

  const modules = await withTimeout(getModules(courseId), 8000);
  // Fetch each module's lessons in parallel.
  const lessonsByModule = await withTimeout(
    Promise.all(modules.map((m) => getLessons(courseId, m.id))),
    8000
  );

  // Total lessons across the whole course + each module's starting offset,
  // used to place every lesson on the fixed 20-station journey map.
  const totalLessons = lessonsByModule.reduce((sum, l) => sum + l.length, 0);
  const startIndexes: number[] = [];
  {
    let running = 0;
    for (const l of lessonsByModule) {
      startIndexes.push(running);
      running += l.length;
    }
  }

  return (
    <div className="py-8">
      <nav className="mb-6 text-sm text-space-muted">
        <Link href="/" className="hover:text-orbit-cyan">
          الرئيسية
        </Link>
        <span className="mx-2">/</span>
        <span className="text-space-ink">
          <Isolate>{course.title}</Isolate>
        </span>
      </nav>

      <header className="mb-8 flex items-start gap-5">
        <Planet seed={course.id} size={88} float className="hidden shrink-0 sm:inline-block" />
        <div>
          <h1 className="mb-3 text-3xl font-extrabold text-white">
            <Isolate>{course.title}</Isolate>
          </h1>
          {course.description && (
            <p className="max-w-reading text-space-muted">
              <Isolate>{course.description}</Isolate>
            </p>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-space-ink">
          <span aria-hidden="true" className="text-orbit-gold">✦</span>
          خريطة الرحلة
        </h2>
        {modules.length === 0 ? (
          <p className="text-space-muted">لم تُضَف وحدات بعد.</p>
        ) : (
          modules.map((module, i) => (
            <ModuleAccordion
              key={module.id}
              courseId={courseId}
              module={module}
              lessons={lessonsByModule[i]}
              index={i}
              startIndex={startIndexes[i]}
              totalLessons={totalLessons}
              defaultOpen={i === 0}
            />
          ))
        )}
      </section>
    </div>
  );
}