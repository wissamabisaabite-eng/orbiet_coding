import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/types";
import { Isolate } from "@/components/Bidi";
import Planet from "@/components/space/Planet";

/**
 * Course card, styled as a "planet" the learner can travel to. If the course
 * has a coverImage we still show it (inside a porthole), otherwise the planet
 * itself is the hero visual. Title/description may embed English/code, so
 * they're wrapped in <Isolate> for bidi safety.
 */
export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="card planet-tile group relative overflow-hidden hover:shadow-orbit"
    >
      {/* faint orbit arc in the corner for atmosphere */}
      <span
        className="orbit-path pointer-events-none absolute -end-10 -top-10 h-28 w-28 opacity-40"
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-center bg-gradient-to-b from-space-navy-700/40 to-space-navy-800 py-6">
        {course.coverImage ? (
          // Cover image framed as a circular "porthole".
          <span className="relative block h-28 w-28 overflow-hidden rounded-full border border-orbit-blue/30 shadow-orbit">
            <Image
              src={course.coverImage}
              alt={course.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          </span>
        ) : (
          <Planet seed={course.id} size={112} float />
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-lg font-bold text-space-ink group-hover:text-white">
          <Isolate>{course.title}</Isolate>
        </h3>
        {course.description && (
          <p className="line-clamp-2 text-sm text-space-muted">
            <Isolate>{course.description}</Isolate>
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orbit-cyan">
          انطلق إلى الكوكب
          <span aria-hidden="true">←</span>
        </span>
      </div>
    </Link>
  );
}
