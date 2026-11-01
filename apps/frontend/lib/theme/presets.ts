import type { ThemePreset, ThemePresetId } from "./types";

/**
 * Built-in colour presets. Each defines a full palette for light and dark
 * appearance so every preset works with Light, Dark and System modes.
 *
 * Contrast is covered by lib/theme/__tests__/presets.test.ts: body text and
 * primary colours must reach WCAG AA (4.5:1) on their surfaces.
 */
export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  warm_professional: {
    id: "warm_professional",
    name: "Warm Professional",
    description: "Terracotta, warm off-white and charcoal. The Robin Labs default.",
    light: {
      // Robin Labs brand palette
      primary: "#A8320C",
      primaryHover: "#8A2908",
      secondary: "#57534E",
      background: "#FAF9F6",
      surface: "#FFFFFF",
      muted: "#F3F1ED",
      textPrimary: "#222222",
      textSecondary: "#737373",
      border: "#EAE7E1",
      borderStrong: "#D9D4CC",
    },
    dark: {
      // Charcoal surfaces with a lightened terracotta accent for contrast
      primary: "#E8825F",
      primaryHover: "#F09B7C",
      secondary: "#C9BFB5",
      background: "#121010",
      surface: "#1A1715",
      muted: "#262220",
      textPrimary: "#F5F3F0",
      textSecondary: "#A8A29E",
      border: "#2E2A27",
      borderStrong: "#44403C",
    },
  },
  modern_enterprise: {
    id: "modern_enterprise",
    name: "Modern Enterprise",
    description: "Indigo and slate. Cool and corporate-neutral.",
    light: {
      primary: "#4F46E5",
      primaryHover: "#4338CA",
      secondary: "#475569",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      muted: "#F1F5F9",
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      border: "#E2E8F0",
      borderStrong: "#CBD5E1",
    },
    dark: {
      primary: "#818CF8",
      primaryHover: "#A5B4FC",
      secondary: "#94A3B8",
      background: "#0B1120",
      surface: "#111827",
      muted: "#1E293B",
      textPrimary: "#E2E8F0",
      textSecondary: "#94A3B8",
      border: "#1F2937",
      borderStrong: "#334155",
    },
  },

  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Navy and blue with a solid navy sidebar.",
    light: {
      primary: "#1D4ED8",
      primaryHover: "#1E40AF",
      secondary: "#0F2A4A",
      background: "#F7F9FC",
      surface: "#FFFFFF",
      muted: "#EEF2F7",
      textPrimary: "#0B1B33",
      textSecondary: "#5A6B82",
      border: "#DCE3EC",
      borderStrong: "#C3CEDC",
      sidebar: { background: "#0B1F3A", foreground: "#E6EDF7", muted: "#9CADC4", border: "#15294A", accent: "#16325A" },
    },
    dark: {
      primary: "#60A5FA",
      primaryHover: "#93C5FD",
      secondary: "#7DA3D1",
      background: "#07111F",
      surface: "#0D1A2D",
      muted: "#142338",
      textPrimary: "#E6EDF7",
      textSecondary: "#93A4BD",
      border: "#1A2B44",
      borderStrong: "#2A3F5E",
      sidebar: { background: "#061024", foreground: "#E6EDF7", muted: "#8EA0BA", border: "#13233B", accent: "#13284A" },
    },
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Monochrome. Lets content and your logo lead.",
    light: {
      primary: "#18181B",
      primaryHover: "#3F3F46",
      secondary: "#52525B",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      muted: "#F4F4F5",
      textPrimary: "#09090B",
      textSecondary: "#71717A",
      border: "#E4E4E7",
      borderStrong: "#D4D4D8",
    },
    dark: {
      primary: "#FAFAFA",
      primaryHover: "#E4E4E7",
      secondary: "#A1A1AA",
      background: "#09090B",
      surface: "#121214",
      muted: "#1C1C1F",
      textPrimary: "#FAFAFA",
      textSecondary: "#A1A1AA",
      border: "#27272A",
      borderStrong: "#3F3F46",
    },
  },


  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Deep indigo, built for dark mode.",
    light: {
      primary: "#4338CA",
      primaryHover: "#3730A3",
      secondary: "#5B5BD6",
      background: "#F5F6FB",
      surface: "#FFFFFF",
      muted: "#ECEEF8",
      textPrimary: "#0B1026",
      textSecondary: "#5B6285",
      border: "#DEE1F0",
      borderStrong: "#C7CCE3",
      sidebar: { background: "#0E1328", foreground: "#E6E8F5", muted: "#9AA0C3", border: "#1A2142", accent: "#1C2450" },
    },
    dark: {
      primary: "#818CF8",
      primaryHover: "#A5B4FC",
      secondary: "#A78BFA",
      background: "#070A17",
      surface: "#0E1328",
      muted: "#151B36",
      textPrimary: "#E6E8F5",
      textSecondary: "#9AA0C3",
      border: "#1D2442",
      borderStrong: "#2B3460",
      sidebar: { background: "#0A0E20", foreground: "#E6E8F5", muted: "#9AA0C3", border: "#171D38", accent: "#1A2148" },
    },
  },
};

/** Preset for new organizations and screens without organization context. */
export const DEFAULT_PRESET_ID: ThemePresetId = "warm_professional";

/** Presets in display order, default first. */
export const THEME_PRESET_LIST = Object.values(THEME_PRESETS);
