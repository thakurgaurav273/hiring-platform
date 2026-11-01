/**
 * Platform (Robin Labs) branding.
 *
 * This is deployment configuration, kept separate from tenant branding: no
 * organization setting or API can change it. Values can be overridden per
 * deployment through NEXT_PUBLIC_* environment variables.
 */
import type { AppearanceMode, ThemeSettings } from "./types";
import { DEFAULT_PRESET_ID } from "./presets";

const env = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback);

/** Default theme for new organizations and for screens without organization context. */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  themePreset: DEFAULT_PRESET_ID,
  primaryColor: null,
  secondaryColor: null,
  sidebarStyle: "solid",
  fontPreset: "default",
  radiusPreset: "comfortable",
};

export const PLATFORM_BRANDING = {
  platformName: "Robin Labs",
  productName: env(process.env.NEXT_PUBLIC_PRODUCT_NAME, "Robin Talent"),
  productTagline: "Hiring, from first application to signed offer.",
  logoUrl: "/RobinLabs.jpeg",
  /** Link target for "Powered by Robin Labs". Omitted when not configured. */
  platformUrl: process.env.NEXT_PUBLIC_PLATFORM_URL?.trim() || null,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  defaultTheme: DEFAULT_THEME_SETTINGS,
  defaultAppearance: "system" as AppearanceMode,
  attribution: {
    label: "Powered by Robin Labs",
    // Platform-level switches; tenants cannot change these.
    showInSidebar: process.env.NEXT_PUBLIC_ATTRIBUTION_SIDEBAR !== "false",
    showOnAuth: process.env.NEXT_PUBLIC_ATTRIBUTION_AUTH !== "false",
    showInAbout: true,
  },
  version: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "1.0.0",
  /** Used by the public website's Terms, Privacy and Cookie pages. */
  legal: {
    entityName: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME, "Robin Labs"),
    contactEmail:
      process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
    lastUpdated: env(process.env.NEXT_PUBLIC_LEGAL_LAST_UPDATED, "1 November 2026"),
  },
} as const;

/**
 * Where "Request a demo" style calls to action point: support email, else
 * the platform website, else null (the CTA is hidden).
 */
export const PLATFORM_CONTACT_HREF: string | null = PLATFORM_BRANDING.supportEmail
  ? `mailto:${PLATFORM_BRANDING.supportEmail}?subject=${encodeURIComponent(`${PLATFORM_BRANDING.productName} demo`)}`
  : PLATFORM_BRANDING.platformUrl;
