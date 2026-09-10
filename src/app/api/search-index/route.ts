import { NextResponse } from "next/server";
import { getCourses, getModules, getLessons } from "@/lib/firestore";

// Cached for 5 minutes — quick search doesn't need to be second-by-second
// fresh, and this keeps repeat opens of the search modal instant.
export const revalidate = 300;

export interface SearchEntry {
  type: "course" | "lesson";
  id: string;
  courseId: string;
  title: string;
  courseTitle: string;
}

export async function GET() {
  const entries: SearchEntry[] = [];

  try {
    const courses = await getCourses();

    for (const course of courses) {
      entries.push({
        type: "course",
        id: course.id,
        courseId: course.id,
        title: course.title,
        courseTitle: course.title,
      });

      const modules = await getModules(course.id);
      const lessonsByModule = await Promise.all(
        modules.map((m) => getLessons(course.id, m.id))
      );

      for (const lessons of lessonsByModule) {
        for (const lesson of lessons) {
          entries.push({
            type: "lesson",
            id: lesson.id,
            courseId: course.id,
            title: lesson.title,
            courseTitle: course.title,
          });
        }
      }
    }

    return NextResponse.json(entries);
  } catch {
    // Search should degrade gracefully — an empty index just means "no
    // results" in the UI, not a broken page.
    return NextResponse.json([]);
  }
}