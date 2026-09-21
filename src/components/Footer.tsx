import Link from "next/link";
import Logo from "@/components/Logo";
import VisitorCounter from "@/components/VisitorCounter";

// Legal/info pages linked from every page footer -- required for Adsterra /
// ExoClick site approval (About, Privacy, Terms, Contact must be reachable
// site-wide, not just from the homepage).
const FOOTER_LINKS = [
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل معنا" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "شروط الاستخدام" },
];

/** Global footer — appears on every page, carries the site-wide visitor counter. */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-orbit-blue/15 bg-space-navy-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo />
          <p className="text-sm text-space-muted">
            مدار — رفيقك في رحلة تعلّم البرمجة
          </p>
        </div>

        <nav
          aria-label="روابط الفوتر"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-space-muted"
        >
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-space-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <VisitorCounter />
          <p className="text-xs text-space-muted">
            © {new Date().getFullYear()} Orbiet
          </p>
        </div>
      </div>
    </footer>
  );
}
