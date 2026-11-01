import Link from "next/link";
import type { ReactNode } from "react";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

/** Shared layout for legal documents: title, summary, table of contents and sections. */
export function LegalPage({
  title,
  path,
  summary,
  sections,
}: {
  title: string;
  path: string;
  summary: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
      <header className="max-w-3xl">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tight sm:text-[42px]">{title}</h1>
        <p className="mt-3 text-[14px] text-muted-foreground">Last updated {PLATFORM_BRANDING.legal.lastUpdated}</p>
        <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-[15px] leading-relaxed">
          {summary}
        </div>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="On this page">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">On this page</h2>
            <ol className="mt-3 space-y-1.5 border-l border-border">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l border-transparent py-1 pl-3 text-[13px] text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
            <h2 className="mt-8 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Other policies</h2>
            <ul className="mt-3 space-y-1.5">
              {LEGAL_LINKS.filter((l) => l.href !== path).map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] font-medium text-primary hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="max-w-3xl">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 border-b border-border py-8 first:pt-0 last:border-0">
              <h2 id={`${s.id}-title`} className="font-display text-[20px] font-semibold tracking-tight">
                {i + 1}. {s.title}
              </h2>
              <div className="legal-prose mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a:hover]:underline [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

/** Contact line used in every legal document. */
export function LegalContact() {
  const { entityName, contactEmail } = PLATFORM_BRANDING.legal;
  return contactEmail ? (
    <>
      {entityName} at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
    </>
  ) : (
    <>{entityName} using the contact details provided in your agreement or on our website</>
  );
}
