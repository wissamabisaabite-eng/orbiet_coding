import type { MetadataRoute } from "next";
import { getCourses, getModules, getLessons } from "@/lib/firestore";

// Same fallback pattern as layout.tsx — set NEXT_PUBLIC_SITE_URL in your
// hosting env to your real domain once you have one.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orbiet.app";

// Regenerate at most every 30 minutes — cheap and keeps new
// courses/lessons discoverable without rebuilding on every request.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const courses = await getCourses();

    for (const course of courses) {
      entries.push({
        url: `${siteUrl}/courses/${course.id}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      const modules = await getModules(course.id);
      const lessonsByModule = await Promise.all(
        modules.map((m) => getLessons(course.id, m.id))
      );

      for (const lessons of lessonsByModule) {
        for (const lesson of lessons) {
          entries.push({
            url: `${siteUrl}/courses/${course.id}/lessons/${lesson.id}`,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // If Firestore is unreachable at build/request time, still return the
    // static entries above instead of failing the whole sitemap.
  }

  return entries;
}