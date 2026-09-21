import type { Metadata } from "next";
import Satellite from "@/components/space/Satellite";
import { Ltr } from "@/components/Bidi";

export const metadata: Metadata = {
  title: "شروط الاستخدام — Orbiet",
  description:
    "شروط استخدام منصة مدار (Orbiet) التعليمية: قواعد استخدام المنصة، الملكية الفكرية، وإخلاء المسؤولية.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "قبول الشروط",
    body: (
      <>
        باستخدامك موقع <Ltr>Orbiet</Ltr> (مدار) فإنك توافق على الالتزام
        بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء منها، يُرجى التوقف
        عن استخدام الموقع.
      </>
    ),
  },
  {
    title: "طبيعة الخدمة",
    body: "مدار منصّة تعليمية تقدّم دروسًا ومسارات لتعلّم البرمجة باللغة العربية. المحتوى مُقدَّم لأغراض تعليمية عامة، وقد يتغيّر أو يُحدَّث أو تتم إضافة/إزالة دورات دون إشعار مسبق.",
  },
  {
    title: "الحساب والاستخدام المقبول",
    body: "إن أنشأت حسابًا على المنصّة، فأنت مسؤول عن الحفاظ على سرّية بيانات الدخول الخاصة بك وعن أي نشاط يتم من خلاله. يُمنع استخدام الموقع لأي غرض غير قانوني، أو محاولة الوصول غير المصرّح به لأنظمتنا، أو نسخ محتوى الدورات وإعادة نشره تجاريًا دون إذن.",
  },
  {
    title: "الملكية الفكرية",
    body: "جميع الدروس والنصوص والرسوم والشعارات وعناصر التصميم في المنصّة مملوكة لمدار (Orbiet) أو مرخَّصة لها، ما لم يُذكر خلاف ذلك، ولا يجوز إعادة استخدامها تجاريًا دون إذن كتابي مسبق.",
  },
  {
    title: "الإعلانات",
    body: (
      <>
        يعرض الموقع إعلانات من شبكات إعلانية خارجية (منها <Ltr>Adsterra</Ltr>{" "}
        و<Ltr>ExoClick</Ltr>) لدعم تقديم المحتوى التعليمي مجانًا. لسنا
        الجهة المسؤولة عن محتوى الإعلانات المعروضة أو عن المواقع التي قد
        تقود إليها، وتخضع تلك الإعلانات لسياسات الشبكات المُعلِنة نفسها.
      </>
    ),
  },
  {
    title: "إخلاء المسؤولية",
    body: "يُقدَّم المحتوى \"كما هو\" دون أي ضمانات صريحة أو ضمنية بشأن دقته أو ملاءمته الكاملة لكل غرض. نبذل قصارى جهدنا لضمان جودة المحتوى، لكننا لا نضمن خلوّه التام من الأخطاء أو استمرارية توفّر الخدمة دون انقطاع.",
  },
  {
    title: "تحديد المسؤولية",
    body: "لا تتحمّل مدار (Orbiet) مسؤولية أي أضرار غير مباشرة أو عرضية تنتج عن استخدام أو تعذّر استخدام المنصّة، إلى أقصى حد يسمح به القانون المعمول به.",
  },
  {
    title: "التعديلات على الشروط",
    body: "قد نُحدّث شروط الاستخدام هذه بين حين وآخر. يُعدّ استمرارك في استخدام الموقع بعد نشر أي تعديل موافقةً ضمنية عليه.",
  },
  {
    title: "التواصل",
    body: "لأي استفسار بخصوص شروط الاستخدام، يُرجى زيارة صفحة تواصل معنا.",
  },
];

export default function TermsPage() {
  return (
    <div className="py-8">
      <section className="mb-10 text-center">
        <Satellite size={56} className="mx-auto mb-4" />
        <h1 className="mx-auto mb-3 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          شروط الاستخدام
        </h1>
        <p className="mx-auto max-w-xl text-space-muted">
          آخر تحديث: <Ltr>2026</Ltr>
        </p>
      </section>

      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="card p-6 sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-space-ink">
              <span aria-hidden="true" className="text-orbit-gold">
                ✦
              </span>
              {s.title}
            </h2>
            <p className="leading-8 text-space-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
