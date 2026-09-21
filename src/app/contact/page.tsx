import type { Metadata } from "next";
import Satellite from "@/components/space/Satellite";
import Planet from "@/components/space/Planet";
import { Ltr } from "@/components/Bidi";

export const metadata: Metadata = {
  title: "تواصل معنا — Orbiet",
  description: "تواصل مع فريق مدار (Orbiet) لأي استفسار أو اقتراح أو ملاحظة.",
};

export default function ContactPage() {
  return (
    <div className="py-8">
      <section className="relative mb-12 overflow-hidden text-center">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="orbit-path relative h-64 w-64 opacity-50 sm:h-80 sm:w-80">
            <span className="absolute -start-4 top-1/3">
              <Planet seed="contact-hero-a" size={30} float />
            </span>
            <span className="absolute end-2 bottom-2">
              <Planet seed="contact-hero-b" size={22} float />
            </span>
          </div>
        </div>

        <div className="relative py-10">
          <Satellite size={64} className="mx-auto mb-4" />
          <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            تواصل معنا
          </h1>
          <p className="mx-auto max-w-xl text-space-muted">
            يسعدنا سماع استفساراتك أو اقتراحاتك أو أي ملاحظة تساعدنا على
            تحسين مدار.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl">
        <section className="card p-6 text-center sm:p-8">
          <h2 className="mb-3 flex items-center justify-center gap-2 text-xl font-bold text-space-ink">
            <span aria-hidden="true" className="text-orbit-gold">
              ✦
            </span>
            البريد الإلكتروني
          </h2>
          <p className="mb-4 text-space-muted">
            راسلنا مباشرة وسنعمل على الرد في أقرب وقت ممكن:
          </p>
          <a href="mailto:ite07673@gmail.com" className="btn-primary inline-block">
            <Ltr>ite07673@gmail.com</Ltr>
          </a>
        </section>
      </div>
    </div>
  );
}
