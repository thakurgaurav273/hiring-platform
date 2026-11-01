import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublic, SITE_URL, careersPath, type CareersListing } from "@/lib/careers";
import { JobListing } from "@/features/careers/JobListing";

type Props = { params: Promise<{ orgSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug } = await params;
  const listing = await fetchPublic<CareersListing>(`/${encodeURIComponent(orgSlug)}`);
  if (!listing) return { title: "Careers" };
  const { organization: org, jobs } = listing;
  const description =
    org.about?.slice(0, 160) || `${jobs.length} open position${jobs.length === 1 ? "" : "s"} at ${org.name}. Find your next role and apply online.`;
  const url = SITE_URL + careersPath(org.slug);
  return {
    title: `Careers at ${org.name}`,
    description,
    alternates: { canonical: url },
    icons: org.branding.faviconUrl ? { icon: org.branding.faviconUrl } : undefined,
    openGraph: {
      title: `Careers at ${org.name}`,
      description,
      url,
      type: "website",
      siteName: org.name,
      images: org.branding.logoUrl ? [{ url: org.branding.logoUrl }] : undefined,
    },
    twitter: { card: "summary", title: `Careers at ${org.name}`, description },
  };
}

export default async function CareersPage({ params }: Props) {
  const { orgSlug } = await params;
  const listing = await fetchPublic<CareersListing>(`/${encodeURIComponent(orgSlug)}`);
  if (!listing) notFound();
  const { organization: org, jobs, filters } = listing;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <section aria-labelledby="careers-title" className="max-w-3xl">
        <h1 id="careers-title" className="font-display text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">
          Work at {org.name}
        </h1>
        {org.about ? (
          <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">{org.about}</p>
        ) : (
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Explore open roles and apply in a few minutes. No account needed.
          </p>
        )}
      </section>

      <JobListing orgSlug={org.slug} jobs={jobs} filters={filters} />
    </div>
  );
}
