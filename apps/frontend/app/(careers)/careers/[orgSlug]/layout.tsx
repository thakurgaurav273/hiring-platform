import Link from "next/link";
import { notFound } from "next/navigation";
import { ThemeScope } from "@/components/marketing/platform-theme-scope";
import { OrgMark, PoweredBy } from "@/components/brand";
import { careersPath, fetchPublic, type CareersListing } from "@/lib/careers";

/**
 * Public careers site for one organization. Rendered with the
 * organization's own branding; no sign-in, no internal data.
 */
export default async function CareersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const listing = await fetchPublic<CareersListing>(`/${encodeURIComponent(orgSlug)}`);
  if (!listing) notFound();
  const { organization: org } = listing;

  return (
    <ThemeScope
      scope={`careers-${org.slug}`}
      settings={{
        themePreset: org.branding.themePreset,
        primaryColor: org.branding.primaryColor,
        secondaryColor: org.branding.secondaryColor,
        fontPreset: org.branding.fontPreset,
        radiusPreset: org.branding.radiusPreset,
        sidebarStyle: "solid",
      }}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 sm:px-8">
          <Link href={careersPath(org.slug)} className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            <OrgMark name={org.name} logoUrl={org.branding.logoUrl} size={32} />
            <span className="font-display text-[16px] font-semibold tracking-tight">{org.name}</span>
          </Link>
          <span className="ml-auto text-[13px] text-muted-foreground">Careers</span>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-[12px] text-muted-foreground sm:flex-row sm:px-8">
          <span>
            © {new Date().getFullYear()} {org.name}
          </span>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
          <PoweredBy placement="auth" />
        </div>
      </footer>
    </ThemeScope>
  );
}
