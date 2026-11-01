import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PLATFORM_BRANDING, PLATFORM_CONTACT_HREF } from "@/lib/theme/platform";
import { STAGES } from "@/constants/stages.constants";
import { StageBadge } from "@/components/stage-badge";
import { ProductPreview } from "@/components/marketing/platform-theme-scope";
import { BrandPlayground } from "@/components/marketing/brand-playground";
import { RoleExplorer } from "@/components/marketing/role-explorer";
import { CandidateJourney } from "@/components/marketing/candidate-journey";

const { productName, platformName } = PLATFORM_BRANDING;

export const metadata: Metadata = {
  title: `${productName}: applicant tracking for the whole hiring team`,
  description: `${productName} by ${platformName} brings jobs, candidates, pipeline, interviews, referrals and reporting into one white-label workspace for recruiters, hiring managers and employees.`,
  openGraph: {
    title: `${productName} by ${platformName}`,
    description: "One hiring workspace for recruiters, hiring managers and every employee. Branded as your own.",
    type: "website",
  },
};

const MODULES = [
  {
    group: "Plan",
    items: [
      ["Jobs", "Roles with department, location and employment type, an assigned recruiter and hiring manager, and a clear status from draft to closed."],
      ["Pipeline", "Ten stages from Applied to Hired. See who is waiting where, move people forward, keep every stage change on record."],
    ],
  },
  {
    group: "Evaluate",
    items: [
      ["Candidates", "One profile per person: contact details, skills, experience, education, links and source, with every application beside it."],
      ["Interviews", "Screening, technical, HR, managerial and final rounds with panelists, structured feedback and a recommendation from each."],
      ["Email", "Threaded conversations with candidates, with attachments, kept in the workspace instead of someone's inbox."],
    ],
  },
  {
    group: "Grow & measure",
    items: [
      ["Referrals", "Every employee can browse open roles and refer people they trust. Referrals arrive tagged with who sent them."],
      ["Reports", "Funnel conversion, applications by department and time-to-hire."],
      ["Timeline", "Who did what and when, with a daily activity heat map."],
      ["Notifications", "In-app, email and browser push, with per-person preferences."],
    ],
  },
];

const FACTS = [
  ["Tenant isolation", "Each organization is resolved from the signed-in session on the server. One organization can never read or change another's users or branding."],
  ["Permissions on the server", "Roles are enforced by the API, not just hidden in the interface."],
  ["Invitation-only", "People join when an administrator invites them. Passwords are hashed with bcrypt; deactivating someone ends their sessions."],
  ["Checked uploads", "Résumés and logos are checked by type, size and real file signature, and stored under server-generated names."],
];

const FAQ = [
  ["Who is it for?", `Organizations that hire continuously and want recruiters, hiring managers and employees in one place, from first application to signed offer.`],
  ["Can we make it look like our company?", "Yes. Name, logo, favicon, colours, font, corners and sidebar style, set once by an administrator and applied to every screen. Try it in the playground above."],
  ["What if our brand colour is hard to read?", "The theme engine checks contrast automatically and adjusts the shade just enough to meet WCAG AA for buttons and links. Settings shows you when it does."],
  ["How do people get access?", "By invitation. An administrator invites each person with a role, and they set their own password from the link."],
  ["Is there dark mode?", "Every preset has a light and a dark version. Administrators choose the default; each person can override it for themselves."],
  ["How do we get started?", `${platformName} sets up your organization and owner account. Branding is optional and can be changed any time.`],
];

function Section({
  id,
  index,
  label,
  title,
  intro,
  children,
  tinted,
}: {
  id: string;
  index: string;
  label: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 border-t border-border ${tinted ? "bg-surface" : ""}`}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          <div className="font-mono text-[12px] text-muted-foreground">
            <span className="text-primary">{index}</span> / {label}
          </div>
          <div>
            <h2 id={`${id}-title`} className="max-w-3xl font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[48px]">
              {title}
            </h2>
            {intro && <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{intro}</p>}
          </div>
        </div>
        <div className="mt-14 lg:mt-16">{children}</div>
      </div>
    </section>
  );
}

function ContactLink({ className = "" }: { className?: string }) {
  if (!PLATFORM_CONTACT_HREF) return null;
  const external = PLATFORM_CONTACT_HREF.startsWith("http");
  return (
    <a
      href={PLATFORM_CONTACT_HREF}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group inline-flex items-center gap-1.5 text-[15px] font-semibold text-foreground underline decoration-border decoration-2 underline-offset-[6px] transition hover:decoration-primary ${className}`}
    >
      Talk to {platformName} <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-24">
          <p className="font-mono text-[12px] text-muted-foreground">
            {productName} <span className="text-primary">·</span> applicant tracking by {platformName}
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-5xl font-display text-[46px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[68px] lg:text-[88px]"
          >
            Hiring is a team sport.
            <br />
            <span className="text-muted-foreground">Give it one</span> <span className="text-primary">field.</span>
          </h1>
          <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="max-w-xl text-[18px] leading-relaxed text-muted-foreground">
                Recruiters, hiring managers and every employee work from the same jobs, candidates and feedback, in a
                workspace that carries your brand, not ours.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#playground"
                  className="inline-flex items-center gap-1.5 text-[15px] font-semibold underline decoration-border decoration-2 underline-offset-[6px] transition hover:decoration-primary"
                >
                  Try it with your brand
                </Link>
                <ContactLink />
              </div>
            </div>
            <CandidateJourney />
          </div>
        </div>

        {/* Pipeline ribbon */}
        <div className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-3" aria-label="Pipeline stages">
              {STAGES.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <StageBadge stage={s} size="md" />
                  {i < STAGES.length - 1 && <span className="h-px w-4 bg-border-strong" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── What's inside ────────────────────────────────────── */}
      <Section
        id="features"
        index="01"
        label="What's inside"
        title="Nine tools that share one record of every candidate."
        intro="No exporting from one tab to paste into another. A résumé, its interviews, the feedback and every email sit on the same profile."
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="space-y-12">
            {MODULES.map((m) => (
              <div key={m.group}>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{m.group}</h3>
                <dl className="mt-4 divide-y divide-border border-y border-border">
                  {m.items.map(([title, text]) => (
                    <div key={title} className="grid gap-1 py-4 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-6">
                      <dt className="font-display text-[17px] font-semibold tracking-tight">{title}</dt>
                      <dd className="text-[14.5px] leading-relaxed text-muted-foreground">{text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductPreview />
            <p className="mt-3 font-mono text-[11.5px] text-muted-foreground">fig. 1: the candidates view, with sample data</p>
          </div>
        </div>
      </Section>

      {/* ── Roles ────────────────────────────────────────────── */}
      <Section
        id="workflow"
        index="02"
        label="Who uses it"
        title="Four roles. Each sees exactly what they need."
        intro="Navigation and permissions follow the role, and the server enforces them. Pick a role to see its sidebar."
        tinted
      >
        <RoleExplorer />
      </Section>

      {/* ── Playground (USP) ─────────────────────────────────── */}
      <Section
        id="playground"
        index="03"
        label="Make it yours"
        title={
          <>
            Your brand, on every screen. <span className="text-muted-foreground">Try it now.</span>
          </>
        }
        intro="This is the same theme engine your administrators use in Settings. Pick a preset, drop in your colours or logo, and see the workspace change live."
      >
        <div id="white-label" className="scroll-mt-16">
          <BrandPlayground />
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          In the product, an administrator applies these settings once and every member sees them, with their own choice of
          light or dark mode.
        </p>
      </Section>

      {/* ── Security ─────────────────────────────────────────── */}
      <Section
        id="security"
        index="04"
        label="Trust"
        title="Candidate data is personal. We treat it that way."
        tinted
      >
        <dl className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {FACTS.map(([title, text]) => (
            <div key={title} className="border-t-2 border-foreground pt-5">
              <dt className="font-display text-[19px] font-semibold tracking-tight">{title}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-12 text-[14px] text-muted-foreground">
          More in our{" "}
          <Link href="/privacy" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <Section id="faq" index="05" label="Questions" title="Good questions, short answers.">
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6">
                <span className="font-display text-[19px] font-semibold tracking-tight sm:text-[21px]">{q}</span>
                <span
                  className="shrink-0 font-mono text-[13px] text-muted-foreground transition group-open:text-primary"
                  aria-hidden="true"
                >
                  <span className="group-open:hidden">+ open</span>
                  <span className="hidden group-open:inline">− close</span>
                </span>
              </summary>
              <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── Closing ──────────────────────────────────────────── */}
      <section aria-labelledby="cta-title" className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <h2 id="cta-title" className="max-w-4xl font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[60px]">
            Bring the whole team to the table.
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Sign in to your workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {PLATFORM_CONTACT_HREF && (
              <a
                href={PLATFORM_CONTACT_HREF}
                className="text-[15px] font-semibold underline decoration-background/30 decoration-2 underline-offset-[6px] hover:decoration-primary"
              >
                New here? Talk to {platformName}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
