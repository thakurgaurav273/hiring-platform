import { z } from "zod";
import {
    AppearanceMode,
    FontPreset,
    RadiusPreset,
    SidebarStyle,
    ThemePreset,
} from "@prisma/client";
import { HEX_COLOR_REGEX } from "./organization.constants";

const hexColor = z
    .string()
    .trim()
    .regex(HEX_COLOR_REGEX, "Colour must be a 6-digit HEX value such as #4F46E5")
    .transform((v) => v.toUpperCase());

/**
 * Branding update payload. Unknown keys are rejected so a client cannot try to
 * set organizationId, asset keys or any other server-owned column.
 */
export const updateBrandingBodySchema = z
    .object({
        displayName: z
            .string()
            .trim()
            .max(80, "Display name must be 80 characters or fewer")
            .nullable()
            .optional()
            // An empty string clears the override and falls back to the organization name.
            .transform((v) => (v === "" ? null : v)),
        themePreset: z.nativeEnum(ThemePreset).optional(),
        primaryColor: hexColor.nullable().optional(),
        secondaryColor: hexColor.nullable().optional(),
        defaultAppearance: z.nativeEnum(AppearanceMode).optional(),
        sidebarStyle: z.nativeEnum(SidebarStyle).optional(),
        fontPreset: z.nativeEnum(FontPreset).optional(),
        radiusPreset: z.nativeEnum(RadiusPreset).optional(),
    })
    .strict();

export type UpdateBrandingInput = z.infer<typeof updateBrandingBodySchema>;

export const updateBrandingSchema = z.object({
    body: updateBrandingBodySchema,
});

export const brandingAssetSchema = z.object({
    params: z.object({
        kind: z.enum(["logo", "favicon"]),
    }),
});

export const updatePreferencesSchema = z.object({
    body: z
        .object({
            // null = follow the organization's default appearance
            appearance: z.nativeEnum(AppearanceMode).nullable(),
        })
        .strict(),
});
