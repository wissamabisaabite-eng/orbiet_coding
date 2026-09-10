"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseModule, Lesson } from "@/types";
import { Isolate, Ltr } from "@/components/Bidi";
import SpaceStation from "@/components/space/SpaceStation";
import MissionPlanet from "@/components/space/MissionPlanet";
import { stageFromProgress } from "@/lib/missionStage";

/**
 * A module rendered as a "docking station": the header is a space station, and
 * its lessons are little planets the learner travels between. Client Component
 * because it toggles open/closed. Chevron rotation is direction-agnostic.
 */
export default function ModuleAccordion({
  courseId,
  module,
  lessons,
  index,
  /** This module's first lesson's position within the WHOLE course (0-based),
   *  used together with `totalLessons` to place each lesson on the fixed
   *  20-station journey map (see lib/missionStage.ts). */
  startIndex = 0,
  totalLessons = lessons.length,
  defaultOpen = false,
}: {
  courseId: string;
  module: CourseModule;
  lessons: Lesson[];
  index: number;
  startIndex?: number;
  totalLessons?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <SpaceStation seed={module.id} size={40} />
          <span className="flex flex-col">
            <span className="text-xs text-orbit-gold">
              المحطة <Ltr>{index + 1}</Ltr>
            </span>
            <span className="font-semibold text-space-ink">
              <Isolate>{module.title}</Isolate>
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-space-muted">
          <span className="text-xs">
            <Ltr>{lessons.length}</Ltr> كواكب
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-orbit-blue/15">
          {lessons.length === 0 ? (
            <p className="px-4 py-3 text-sm text-space-muted">لا توجد كواكب في هذه المحطة.</p>
          ) : (
            <ul className="relative p-2">
              {lessons.map((lesson, i) => {
                const stage = stageFromProgress(startIndex + i, totalLessons);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-space-muted transition-colors hover:bg-orbit-blue/10 hover:text-space-ink"
                    >
                      <MissionPlanet seed={lesson.id} stage={stage} size={40} label={String(i + 1)} />
                      <span className="flex flex-1 flex-col">
                        <span className="text-[11px] text-orbit-cyan">
                          الكوكب <Ltr>{i + 1}</Ltr>
                        </span>
                        <span className="leading-snug">
                          <Isolate>{lesson.title}</Isolate>
                        </span>
                      </span>
                      <span
                        className="text-orbit-cyan opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      >
                        ←
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
