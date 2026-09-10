import CourseCard from "@/components/CourseCard";
import AdBanner from "@/components/ads/AdBanner";
import { getCourses } from "@/lib/firestore";
import { Ltr } from "@/components/Bidi";
import Planet from "@/components/space/Planet";
import type { Course } from "@/types";
import { withTimeout, TimeoutError } from "@/lib/withTimeout";
import RetryButton from "@/components/RetryButton";

// Server Component: fetch courses for SEO + performance.
export const revalidate = 300; // re-fetch course list at most every 5 minutes

export default async function HomePage() {
  let courses: Course[];
  let errorKind: "timeout" | "generic" | null = null;
  try {
    // Don't let a slow/hanging connection leave the visitor waiting forever —
    // fail fast after 8s with a clear "try again" message instead.
    courses = await withTimeout(getCourses(), 8000);
  } catch (err) {
    errorKind = err instanceof TimeoutError ? "timeout" : "generic";
    courses = [];
  }

  return (
    <div className="py-8">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden text-center">
        {/* Decorative orbit scene: a central sun with planets on dashed orbits. */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="orbit-path relative h-72 w-72 opacity-60 sm:h-96 sm:w-96">
            <span className="orbit-path absolute inset-8" />
            <span className="absolute -start-3 top-1/2 -translate-y-1/2">
              <Planet seed="hero-a" size={40} float />
            </span>
            <span className="absolute end-6 top-6">
              <Planet seed="hero-b" size={28} float />
            </span>
          </div>
        </div>

        <div className="relative py-10">
          <p className="mb-3 text-sm font-medium text-orbit-gold">
            مدار · <Ltr>Orbiet</Ltr>
          </p>
          <h1
            className="mx-auto mb-3 max-w-2xl text-4xl font-normal leading-tight tracking-wide text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            رحلتك في تعلّم البرمجة تبدأ من هنا
          </h1>
          <p className="mx-auto max-w-md text-space-muted">
  دورات عربية عالمية من البداية إلى الاحتراف.
</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="#courses" className="btn-primary">
              انطلق في رحلتك
            </a>
          </div>
        </div>
      </section>

      {/* Course grid */}
      <section id="courses" className="scroll-mt-20">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-space-ink">
          <span aria-hidden="true" className="text-orbit-gold">✦</span>
          وجهات في مجرّتك
        </h2>

        {errorKind === "timeout" ? (
          <div className="rounded-lg border border-orbit-gold/30 bg-space-navy-800 p-5 text-center">
            <p className="mb-4 text-space-muted">
              استغرق الاتصال بالمحطة وقتًا أطول من المعتاد. تحقق من اتصالك
              بالإنترنت وأعد المحاولة.
            </p>
            <RetryButton />
          </div>
        ) : errorKind === "generic" ? (
          <div className="rounded-lg border border-orbit-gold/30 bg-space-navy-800 p-5 text-center">
            <p className="mb-4 text-space-muted">
              تعذّر تحميل الدورات حاليًا. تأكّد من إعداد قيم <Ltr>Firebase</Ltr>{" "}
              في ملف <Ltr>.env.local</Ltr> ثم أعد المحاولة.
            </p>
            <RetryButton />
          </div>
        ) : courses.length === 0 ? (
          <p className="text-space-muted">لا توجد دورات بعد.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Ad: banner between the course grid and the footer (approved placement). */}
      <div className="mt-14">
        <AdBanner slot="home-grid-below" format="leaderboard" />
      </div>
    </div>
  );
}