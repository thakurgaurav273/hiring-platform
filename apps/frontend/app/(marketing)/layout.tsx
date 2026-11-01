import { PlatformThemeScope } from "@/components/marketing/platform-theme-scope";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

// Public website: landing page and legal pages. Always uses Robin Labs
// platform branding, never an organization's theme.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformThemeScope>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-[13px] focus:shadow"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </PlatformThemeScope>
  );
}
