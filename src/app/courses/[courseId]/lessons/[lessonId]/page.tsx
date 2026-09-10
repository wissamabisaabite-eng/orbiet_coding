import { notFound } from "next/navigation";
import Link from "next/link";
import LessonContent from "@/components/lesson/LessonContent";
import LessonNav from "@/components/lesson/LessonNav";
import ExerciseCheck from "@/components/lesson/ExerciseCheck";
import AdBanner from "@/components/ads/AdBanner";
import {
  getCourse,
  getExerciseAnswers,
  getExercises,
  getLessonWithContext,
} from "@/lib/firestore";
import { Isolate } from "@/components/Bidi";
import MissionPlanet from "@/components/space/MissionPlanet";
import { stageFromProgress } from "@/lib/missionStage";
import { withTimeout } from "@/lib/withTimeout";

export const revalidate = 300;

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const [course, { lesson, flat }] = await withTimeout(
    Promise.all([getCourse(courseId), getLessonWithContext(courseId, lessonId)]),
    8000
  );

  if (!course || !lesson) notFound();

  // Exercises + answer key live under the resolved module.
  const [exercises, answers] = await withTimeout(
    Promise.all([
      getExercises(courseId, lesson.moduleId, lesson.id),
      getExerciseAnswers(courseId, lesson.moduleId, lesson.id),
    ]),
    8000
  );

  const lessonPosition = flat.findIndex((l) => l.id === lesson.id);
  const lessonStage = stageFromProgress(Math.max(0, lessonPosition), flat.length);

  return (
    <div className="py-8">
      <nav className="mb-6 text-sm text-space-muted">
        <Link href="/" className="hover:text-orbit-cyan">
          الرئيسية
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/courses/${courseId}`} className="hover:text-orbit-cyan">
          <Isolate>{course.title}</Isolate>
        </Link>
      </nav>

      {/*
        Lesson layout: reading column + desktop-only sidebar ad.
        The sidebar is hidden on mobile (lg:) so it never narrows the reading
        column on small screens (section 6 / section 8).
      */}
      <div className="flex flex-col gap-8 lg:flex-row">
        <article className="min-w-0 flex-1">
          {/* "Arriving at" the lesson-planet: the same planet shown in the module list. */}
          <div className="mb-6 flex items-center gap-4">
            <MissionPlanet seed={lesson.id} stage={lessonStage} size={64} float />
            <div>
              <p className="text-xs text-orbit-gold">وجهتك الحالية</p>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                <Isolate>{lesson.title}</Isolate>
              </h1>
            </div>
          </div>

          <LessonContent lesson={lesson} />

          {/* Prev/Next across the whole course; Next is gated by the video ad. */}
          <LessonNav courseId={courseId} flat={flat} currentLessonId={lesson.id} />

          {/* Comprehension checks. */}
          <ExerciseCheck exercises={exercises} answers={answers} />
        </article>

        {/* Desktop-only sidebar banner. Hidden on mobile. */}
        <aside className="hidden shrink-0 lg:block">
          <div className="sticky top-20">
            <AdBanner slot="lesson-sidebar" format="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  );
}