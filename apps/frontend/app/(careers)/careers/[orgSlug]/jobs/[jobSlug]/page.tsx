import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarClock, MapPin, Users } from "lucide-react";
import {
  EMPLOYMENT_LABELS,
  SITE_URL,
  careersPath,
  fetchPublic,
  jobIdFromSlug,
  jobPath,
  jobSlug,
  type CareersJobDetail,
  type PublicJob,
  type PublicOrganization,
} from "@/lib/careers";
import { ApplyForm } from "@/features/careers/ApplyForm";

type Props = {
  params: Promise<{ orgSlug: string; jobSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(orgSlug: string, slug: string, channel?: "embed") {
  const jobId = jobIdFromSlug(slug);
  if (!jobId) return null;
  const qs = channel ? "?channel=embed" : "";
  return fetchPublic<CareersJobDetail>(`/${encodeURIComponent(orgSlug)}/jobs/${jobId}${qs}`);
}

const channelOf = (sp: Record<string, string | string[] | undefined>) => (sp.channel === "embed" ? ("embed" as const) : undefined);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { orgSlug, jobSlug: slug } = await params;
  const detail = await load(orgSlug, slug, channelOf(await searchParams));
  if (!detail) return { title: "Job not found" };
  const { organization: org, job } = detail;
  const url = SITE_URL + jobPath(org.slug, job);
  const description = summary(job);
  return {
    title: `${job.title} at ${org.name}`,
    description,
    alternates: { canonical: url },
    icons: org.branding.faviconUrl ? { icon: org.branding.faviconUrl } : undefined,
    openGraph: {
      title: `${job.title} at ${org.name}`,
      description,
      url,
      type: "website",
      siteName: org.name,
      images: org.branding.logoUrl ? [{ url: org.branding.logoUrl }] : undefined,
    },
    twitter: { card: "summary", title: `${job.title} at ${org.name}`, description },
  };
}

function summary(job: PublicJob) {
  const parts = [job.department, job.location, EMPLOYMENT_LABELS[job.employmentType]].filter(Boolean).join(" · ");
  const text = job.description.replace(/\s+/g, " ").trim();
  return `${parts}. ${text}`.slice(0, 200);
}

const SCHEMA_EMPLOYMENT: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
};

/** schema.org JobPosting so search engines (e.g. Google for Jobs) can index the role. */
function jobPostingJsonLd(org: PublicOrganization, job: PublicJob) {
  const remote = !!job.location && /remote/i.test(job.location);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
      .join(""),
    identifier: { "@type": "PropertyValue", name: org.name, value: job.id },
    datePosted: job.createdAt,
    employmentType: SCHEMA_EMPLOYMENT[job.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: org.name,
      sameAs: SITE_URL + careersPath(org.slug),
      ...(org.branding.logoUrl ? { logo: org.branding.logoUrl } : {}),
    },
    directApply: true,
    url: SITE_URL + jobPath(org.slug, job),
  };
  if (job.applicationDeadline) data.validThrough = job.applicationDeadline;
  if (remote) {
    data.jobLocationType = "TELECOMMUTE";
  } else if (job.location) {
    data.jobLocation = { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } };
  }
  if (job.skills.length) data.skills = job.skills.join(", ");
  if (job.experience) data.experienceRequirements = job.experience;
  // Escape "<" so the payload can't close the script tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function JobPage({ params, searchParams }: Props) {
  const { orgSlug, jobSlug: slug } = await params;
  const sp = await searchParams;
  const channel = channelOf(sp);
  const detail = await load(orgSlug, slug, channel);
  if (!detail) notFound();
  const { organization: org, job, consentVersion } = detail;

  // Keep one canonical URL per job (e.g. after the title changes).
  if (slug !== jobSlug(job)) {
    const qs = new URLSearchParams(
      Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))
    ).toString();
    permanentRedirect(jobPath(org.slug, job) + (qs ? `?${qs}` : ""));
  }

  const facts = [
    { icon: Briefcase, label: job.department },
    job.location ? { icon: MapPin, label: job.location } : null,
    { icon: Users, label: `${EMPLOYMENT_LABELS[job.employmentType]}${job.numOpenings > 1 ? ` · ${job.numOpenings} openings` : ""}` },
    job.applicationDeadline
      ? { icon: CalendarClock, label: `Apply by ${new Date(job.applicationDeadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` }
      : null,
  ].filter(Boolean) as { icon: typeof Briefcase; label: string }[];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jobPostingJsonLd(org, job) }} />

      <Link
        href={careersPath(org.slug)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All roles at {org.name}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <article>
          <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]">{job.title}</h1>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon className="size-4" aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>

          <div className="mt-8 whitespace-pre-line text-[15.5px] leading-[1.7] text-foreground/90">{job.description}</div>

          {(job.skills.length > 0 || job.experience) && (
            <dl className="mt-8 grid gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2">
              {job.experience && (
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Experience</dt>
                  <dd className="mt-1.5 text-[14.5px]">{job.experience}</dd>
                </div>
              )}
              {job.skills.length > 0 && (
                <div>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Skills</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[13px]">
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </article>

        <aside id="apply" className="scroll-mt-6 lg:sticky lg:top-6">
          <ApplyForm orgSlug={org.slug} orgName={org.name} job={job} consentVersion={consentVersion} channel={channel} />
        </aside>
      </div>
    </div>
  );
}
