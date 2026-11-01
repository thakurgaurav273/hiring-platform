import {
    AppearanceMode,
    FontPreset,
    RadiusPreset,
    SidebarStyle,
    ThemePreset,
} from "@prisma/client";

/**
 * Default branding applied to every new organization: the Robin Labs
 * "Warm Professional" theme (terracotta on warm off-white). These mirror the column defaults in the Prisma
 * schema and the frontend theme engine (apps/frontend/lib/theme).
 */
export const DEFAULT_BRANDING = {
    themePreset: ThemePreset.warm_professional,
    primaryColor: null,
    secondaryColor: null,
    defaultAppearance: AppearanceMode.system,
    sidebarStyle: SidebarStyle.solid,
    fontPreset: FontPreset.default,
    radiusPreset: RadiusPreset.comfortable,
} as const;

export type BrandingAssetKind = "logo" | "favicon";

/** Accepted image formats and size limits per asset kind (bytes). */
export const BRANDING_ASSET_RULES: Record<
    BrandingAssetKind,
    { maxBytes: number; types: ReadonlyArray<"png" | "jpg" | "webp" | "ico"> }
> = {
    logo: { maxBytes: 2 * 1024 * 1024, types: ["png", "jpg", "webp"] },
    favicon: { maxBytes: 512 * 1024, types: ["png", "ico"] },
};

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
