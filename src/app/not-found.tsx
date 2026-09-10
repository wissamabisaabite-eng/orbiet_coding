import Link from "next/link";
import { Ltr } from "@/components/Bidi";
import Planet from "@/components/space/Planet";

/**
 * Custom "lost in space" 404 — replaces Next's default not-found screen for
 * any unmatched route or explicit notFound() call. No auth/data required.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6 flex items-center justify-center">
        <span
          className="orbit-path pointer-events-none absolute h-40 w-40 rounded-full opacity-50"
          aria-hidden="true"
        />
        <Planet seed="not-found" size={100} float />
      </div>

      <p className="mb-2 font-mono text-5xl text-orbit-gold">
        <Ltr>404</Ltr>
      </p>
      <h1 className="mb-3 text-2xl font-bold text-white">
        سفينتك خرجت عن المدار
      </h1>
      <p className="mb-8 max-w-md text-space-muted">
        لم نعثر على هذه المحطة. ربما انتقل الدرس أو الدورة إلى مسار آخر، أو
        أن الرابط لم يعد صالحًا.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          العودة إلى الرئيسية
        </Link>
        <Link href="/about" className="btn-ghost">
          من نحن
        </Link>
      </div>
    </div>
  );
}