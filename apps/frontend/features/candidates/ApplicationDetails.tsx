"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

/** Shape of an application as returned by GET /candidates/:id. */
export interface CandidateApplication {
  id: string;
  jobId: string;
  appliedAt: string;
  currentStage: string;
  sourceType: string;
  sourceName: string | null;
  sourceDetails: Record<string, string | undefined> | null;
  coverLetter: string | null;
  answers: { id: string; label: string; answer: string }[] | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  consentAt: string | null;
  consentVersion: string | null;
  job?: { id: string; title: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  CAREERS_PAGE: "Robin Talent Careers",
  COMPANY_WEBSITE: "Company Website",
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  NAUKRI: "Naukri",
  EMPLOYEE_REFERRAL: "Employee Referral",
  EMAIL: "Email",
  EXTERNAL_API: "External API",
  MANUAL: "Manual Import",
  OTHER: "Other",
};

export const sourceLabel = (a: Pick<CandidateApplication, "sourceType" | "sourceName">) =>
  SOURCE_LABELS[a.sourceType] ?? a.sourceName ?? a.sourceType;

/** Only http(s) links are rendered as links; anything else is shown as text. */
const safeHref = (url: string | null) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{l}</span>
      <span className="min-w-0 break-words text-right text-foreground">{children}</span>
    </div>
  );
}

function ExtLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const safe = safeHref(href);
  if (!safe) return <>{href}</>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:underline">
      {children} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

/** Right-rail card: where each application came from. The source never changes after the application is created. */
export function ApplicationSourceCard({ applications }: { applications: CandidateApplication[] }) {
  if (!applications.length) return null;
  return (
    <div className="surface-card p-5">
      <div className="text-[13px] font-semibold">{applications.length > 1 ? "Applications" : "Application"}</div>
      <div className="mt-3 divide-y divide-border">
        {applications.map((a) => {
          const d = a.sourceDetails ?? {};
          const campaign = [d.utm_campaign, d.utm_medium].filter(Boolean).join(" · ");
          return (
            <div key={a.id} className="space-y-2.5 py-3 text-[12px] first:pt-0 last:pb-0">
              {a.job && (
                <Row l="Job">
                  <Link href={`/jobs/${a.job.id}`} className="hover:underline">
                    {a.job.title}
                  </Link>
                </Row>
              )}
              <Row l="Source">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">{sourceLabel(a)}</span>
              </Row>
              {a.sourceName && a.sourceName !== sourceLabel(a) && <Row l="Source detail">{a.sourceName}</Row>}
              {campaign && <Row l="Campaign">{campaign}</Row>}
              {d.utm_source && <Row l="utm_source">{d.utm_source}</Row>}
              {d.referrerHost && <Row l="Referred from">{d.referrerHost}</Row>}
              <Row l="Applied">{fmtDate(a.appliedAt)}</Row>
              {a.linkedinUrl && (
                <Row l="LinkedIn">
                  <ExtLink href={a.linkedinUrl}>Profile</ExtLink>
                </Row>
              )}
              {a.portfolioUrl && (
                <Row l="Portfolio">
                  <ExtLink href={a.portfolioUrl}>Website</ExtLink>
                </Row>
              )}
              {a.consentAt && (
                <Row l="Consent">
                  {fmtDate(a.consentAt)}
                  {a.consentVersion ? ` (notice ${a.consentVersion})` : ""}
                </Row>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Overview card: cover letter and answers to the job's application questions. */
export function ApplicationResponses({ application }: { application: CandidateApplication | undefined }) {
  if (!application) return null;
  const answers = Array.isArray(application.answers) ? application.answers : [];
  if (!application.coverLetter && answers.length === 0) return null;
  return (
    <div className="surface-card p-5">
      <div className="text-[13px] font-semibold">Application{application.job ? ` for ${application.job.title}` : ""}</div>
      {application.coverLetter && (
        <div className="mt-3">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Cover letter</div>
          <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-[1.65] text-muted-foreground">{application.coverLetter}</p>
        </div>
      )}
      {answers.length > 0 && (
        <dl className="mt-4 space-y-3">
          {answers.map((q) => (
            <div key={q.id}>
              <dt className="text-[12px] font-medium">{q.label}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-[13px] text-muted-foreground">{q.answer || "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
