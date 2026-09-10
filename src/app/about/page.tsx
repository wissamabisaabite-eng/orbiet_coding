import type { Metadata } from "next";
import Link from "next/link";
import Planet from "@/components/space/Planet";
import SpaceStation from "@/components/space/SpaceStation";
import Satellite from "@/components/space/Satellite";
import { Ltr } from "@/components/Bidi";

export const metadata: Metadata = {
  title: "من نحن — Orbiet",
  description: "تعرّف على مدار (Orbiet) ورسالتنا في تبسيط تعلّم البرمجة بالعربية.",
};

const VALUES = [
  {
    title: "وضوح المسار",
    text: "كل درس محطة في رحلة، تعرف دائمًا أين أنت وإلى أين تتجه.",
    seed: "about-value-1",
  },
  {
    title: "عربي أولًا",
    text: "شرح مبسّط بالعربية، مع الحفاظ على مصطلحات البرمجة كما هي.",
    seed: "about-value-2",
  },
  {
    title: "تطبيق عملي",
    text: "أمثلة كود حقيقية وتمارين قصيرة بعد كل محطة لترسيخ الفهم.",
    seed: "about-value-3",
  },
];

export default function AboutPage() {
  return (
    <div className="py-8">
      {/* Hero */}
      <section className="relative mb-14 overflow-hidden text-center">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="orbit-path relative h-64 w-64 opacity-50 sm:h-80 sm:w-80">
            <span className="absolute -start-4 top-1/3">
              <Planet seed="about-hero-a" size={34} float />
            </span>
            <span className="absolute end-2 bottom-2">
              <Planet seed="about-hero-b" size={24} float />
            </span>
          </div>
        </div>

        <div className="relative py-10">
          <Satellite size={72} className="mx-auto mb-4" />
          <p className="mb-3 text-sm font-medium text-orbit-gold">
            مدار · <Ltr>Orbiet</Ltr>
          </p>
          <h1 className="mx-auto mb-4 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            من نحن
          </h1>
          <p className="mx-auto max-w-xl text-space-muted">
            محطة فضائية صغيرة لتعلّم البرمجة — نرافقك محطةً بعد محطة حتى تصل.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mb-14 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-space-ink">
            <span aria-hidden="true" className="text-orbit-gold">✦</span>
            رسالتنا
          </h2>
          <p className="leading-8 text-space-muted">
            نؤمن أن تعلّم البرمجة لا يجب أن يكون معقّدًا أو مخيفًا. لذلك بنينا{" "}
            <Ltr>Orbiet</Ltr> ليكون مسارًا واضحًا كحركة الكواكب حول مدارها: خطوة
            بعد خطوة، من الأساسيات إلى بناء تطبيقات حقيقية.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="orbit-path relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
            <span className="orbit-path absolute inset-6" />
            <Planet seed="about-mission-sun" size={70} />
            <span className="absolute -start-2 top-1/2 -translate-y-1/2">
              <Planet seed="about-mission-a" size={30} float />
            </span>
            <span className="absolute end-4 top-4">
              <SpaceStation seed="about-mission-b" size={36} className="orbit-drift" />
            </span>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-14">
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-space-ink">
          <span aria-hidden="true" className="text-orbit-gold">✦</span>
          ما يميّزنا
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.seed} className="card planet-tile p-6 text-center">
              <Planet seed={v.seed} size={56} float className="mx-auto mb-4" />
              <h3 className="mb-2 font-bold text-white">{v.title}</h3>
              <p className="text-sm leading-7 text-space-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="card relative mb-14 overflow-hidden p-8 text-center sm:p-10">
        <div className="orbit-twinkle absolute -end-6 -top-6" aria-hidden="true">
          <Planet seed="about-cta" size={90} />
        </div>
        <h2 className="relative mb-3 text-2xl font-extrabold text-white">
          جاهز للانطلاق؟
        </h2>
        <p className="relative mx-auto mb-6 max-w-md text-space-muted">
          ابدأ أول محطة في رحلتك الآن، مجانًا بالكامل.
        </p>
        <Link href="/#courses" className="btn-primary relative inline-block">
          استكشف الدورات
        </Link>
      </section>

      {/* Contact */}
      <section className="card p-6 text-center sm:p-8">
        <h2 className="mb-3 flex items-center justify-center gap-2 text-xl font-bold text-space-ink">
          <span aria-hidden="true" className="text-orbit-gold">✦</span>
          تواصل معنا
        </h2>
        <p className="mb-4 text-space-muted">
          لأي استفسار أو اقتراح، راسلنا مباشرة عبر البريد الإلكتروني:
        </p>
        <a
          href="mailto:ite07673@gmail.com"
          className="btn-ghost inline-block"
        >
          <Ltr>ite07673@gmail.com</Ltr>
        </a>
      </section>
    </div>
  );
}
