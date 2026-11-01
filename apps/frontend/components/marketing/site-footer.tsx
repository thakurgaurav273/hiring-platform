import Link from "next/link";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { PlatformLockup, PoweredBy } from "@/components/brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Product" },
      { href: "/#workflow", label: "Roles" },
      { href: "/#playground", label: "Brand playground" },
      { href: "/#security", label: "Trust & security" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

export function SiteFooter() {
  const { productName, productTagline, platformName, supportEmail } = PLATFORM_BRANDING;
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <PlatformLockup />
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">{productTagline}</p>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="mt-4 inline-block text-[13.5px] font-medium text-primary hover:underline">
              {supportEmail}
            </a>
          )}
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13.5px] text-foreground/80 transition hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-muted-foreground sm:flex-row sm:px-8">
          <span>
            © {new Date().getFullYear()} {platformName}. {productName} is a {platformName} product.
          </span>
          <PoweredBy placement="auth" />
        </div>
      </div>
    </footer>
  );
}
