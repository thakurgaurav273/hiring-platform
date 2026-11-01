// Theme option values. These must match the Prisma enums in
// apps/backend/src/database/prisma/schema.prisma.

export const THEME_PRESET_IDS = [
  "modern_enterprise",
  "corporate",
  "minimal",
  "warm_professional",
  "midnight",
] as const;
export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export const APPEARANCE_MODES = ["light", "dark", "system"] as const;
export type AppearanceMode = (typeof APPEARANCE_MODES)[number];
export type ResolvedMode = "light" | "dark";

export const SIDEBAR_STYLES = ["solid", "subtle", "transparent"] as const;
export type SidebarStyle = (typeof SIDEBAR_STYLES)[number];

export const FONT_PRESETS = ["default", "modern", "classic"] as const;
export type FontPreset = (typeof FONT_PRESETS)[number];

export const RADIUS_PRESETS = ["compact", "comfortable", "rounded"] as const;
export type RadiusPreset = (typeof RADIUS_PRESETS)[number];

/** The subset of organization branding that affects the theme. */
export interface ThemeSettings {
  themePreset: ThemePresetId;
  primaryColor: string | null;
  secondaryColor: string | null;
  sidebarStyle: SidebarStyle;
  fontPreset: FontPreset;
  radiusPreset: RadiusPreset;
}

/** Organization branding as returned by GET /organization/branding. */
export interface OrganizationBranding extends ThemeSettings {
  organizationId: string;
  organizationName: string;
  displayName: string;
  customDisplayName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  defaultAppearance: AppearanceMode;
  updatedAt: string;
}

/** Public branding exposed on invitation links (no auth required). */
export type InvitationBranding = Pick<
  OrganizationBranding,
  "displayName" | "logoUrl" | "themePreset" | "primaryColor" | "secondaryColor" | "fontPreset" | "radiusPreset"
>;

export interface Workspace {
  organization: { id: string; name: string; slug: string };
  branding: OrganizationBranding;
  preferences: { appearance: AppearanceMode | null };
  permissions: { canManageBranding: boolean; isOwner: boolean };
}

/** A palette for one appearance mode. All values are #RRGGBB. */
export interface Palette {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  muted: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  borderStrong: string;
  /** Optional dedicated sidebar colours, used when sidebar style is "solid". */
  sidebar?: { background: string; foreground: string; muted: string; border: string; accent: string };
}

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  light: Palette;
  dark: Palette;
}
