import type { ReactNode } from "react";
import { buildScopedThemeCss } from "@/lib/theme/engine";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { BrandingPreview } from "@/features/settings/branding/BrandingPreview";
import type { ThemeSettings } from "@/lib/theme/types";

/**
 * Applies a theme to a subtree for both light and dark mode with static CSS,
 * so it renders identically on server and client (no hydration mismatch, no
 * flash). Light/dark follows the visitor's current appearance.
 */
function ThemeScope({
  settings,
  scope,
  className,
  children,
}: {
  settings: ThemeSettings;
  scope: string;
  className?: string;
  children: ReactNode;
}) {
  const css = buildScopedThemeCss(settings, `[data-theme-scope="${scope}"]`);
  return (
    <div data-theme-scope={scope} className={className}>
      <style>{css}</style>
      {children}
    </div>
  );
}

/**
 * The public website always shows Robin Labs platform branding, even when the
 * visitor is signed in to an organization with its own theme.
 */
export function PlatformThemeScope({ children }: { children: ReactNode }) {
  return (
    <ThemeScope settings={PLATFORM_BRANDING.defaultTheme} scope="platform" className="min-h-screen bg-background text-foreground">
      {children}
    </ThemeScope>
  );
}

/** Product preview with sample data, themed with the given settings. */
export function ProductPreview({
  settings = PLATFORM_BRANDING.defaultTheme,
  brandName = "Acme Corp",
}: {
  settings?: ThemeSettings;
  brandName?: string;
}) {
  return (
    <ThemeScope settings={settings} scope={`preview-${settings.themePreset}`}>
      <BrandingPreview settings={settings} brand={{ name: brandName, logoUrl: null }} />
    </ThemeScope>
  );
}
