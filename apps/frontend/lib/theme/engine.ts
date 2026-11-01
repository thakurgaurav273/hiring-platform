/**
 * Theme engine: turns platform defaults + organization branding into CSS
 * custom properties. CSS variables are the single source of truth: Tailwind
 * utilities (bg-primary, text-muted-foreground, rounded-lg …) read them via
 * the `@theme inline` block in app/globals.css.
 */
import type { CSSProperties } from "react";
import { ensureContrast, mix, readableForeground } from "./color";
import { DEFAULT_PRESET_ID, THEME_PRESETS } from "./presets";
import type {
  FontPreset,
  RadiusPreset,
  ResolvedMode,
  ThemeSettings,
} from "./types";

export type ThemeTokens = Record<`--${string}`, string>;

export interface BuiltTheme {
  tokens: ThemeTokens;
  /** Set when a custom colour had to be adjusted to meet WCAG AA. */
  adjustments: { primary?: string; secondary?: string };
}

/** Status colours are semantic and identical across presets. */
const STATUS: Record<ResolvedMode, Record<string, string>> = {
  light: {
    "--destructive": "#DC2626",
    "--destructive-foreground": "#FFFFFF",
    "--success": "#15803D",
    "--warning": "#B45309",
    "--info": "#2563EB",
  },
  dark: {
    "--destructive": "#F87171",
    "--destructive-foreground": "#0F172A",
    "--success": "#4ADE80",
    "--warning": "#FBBF24",
    "--info": "#60A5FA",
  },
};

/** Base radius in px. Tailwind's rounded-sm … rounded-2xl are derived from it. */
export const RADIUS_PX: Record<RadiusPreset, number> = {
  compact: 6,
  comfortable: 10,
  rounded: 14,
};

/**
 * Font stacks reference next/font variables declared in app/layout.tsx.
 * "classic" pairs a serif display face with the default body face.
 */
export const FONT_STACKS: Record<FontPreset, { sans: string; display: string }> = {
  default: {
    sans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    display: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  modern: {
    sans: "var(--font-geist), ui-sans-serif, system-ui, sans-serif",
    display: "var(--font-geist), ui-sans-serif, system-ui, sans-serif",
  },
  classic: {
    sans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    display: "var(--font-serif), ui-serif, Georgia, serif",
  },
};

export function buildTheme(settings: ThemeSettings, mode: ResolvedMode): BuiltTheme {
  const preset = THEME_PRESETS[settings.themePreset] ?? THEME_PRESETS[DEFAULT_PRESET_ID];
  const p = preset[mode];
  const adjustments: BuiltTheme["adjustments"] = {};

  // Primary: used for buttons, links and focus rings, so it must read as text
  // on both the page background and card surfaces (WCAG AA 4.5:1).
  let primary = p.primary;
  let primaryHover = p.primaryHover;
  if (settings.primaryColor) {
    const checked = ensureContrast(settings.primaryColor, [p.surface, p.background], 4.5);
    primary = checked.color;
    if (checked.adjusted) adjustments.primary = checked.color;
    primaryHover = mode === "light" ? mix(primary, "#000000", 0.14) : mix(primary, "#FFFFFF", 0.18);
  }
  const primaryForeground = readableForeground(primary);

  // Brand secondary: charts and accents (graphics need 3:1).
  let secondary = p.secondary;
  if (settings.secondaryColor) {
    const checked = ensureContrast(settings.secondaryColor, p.surface, 3);
    secondary = checked.color;
    if (checked.adjusted) adjustments.secondary = checked.color;
  }

  // Sidebar style
  let sidebar: { background: string; foreground: string; muted: string; border: string; accent: string };
  switch (settings.sidebarStyle) {
    case "subtle": {
      const background = mix(p.background, primary, mode === "light" ? 0.035 : 0.06);
      sidebar = {
        background,
        foreground: p.textPrimary,
        muted: p.textSecondary,
        border: p.border,
        accent: mix(background, primary, mode === "light" ? 0.09 : 0.16),
      };
      break;
    }
    case "transparent":
      sidebar = {
        background: p.background,
        foreground: p.textPrimary,
        muted: p.textSecondary,
        border: p.background,
        accent: p.muted,
      };
      break;
    case "solid":
    default:
      sidebar = p.sidebar ?? {
        background: p.surface,
        foreground: p.textPrimary,
        muted: p.textSecondary,
        border: p.border,
        accent: p.muted,
      };
  }
  const sidebarPrimary = ensureContrast(primary, sidebar.background, 3).color;
  // Active navigation item text: the brand colour, readable on the active pill.
  const sidebarActive = ensureContrast(primary, sidebar.accent, 4.5).color;

  const fonts = FONT_STACKS[settings.fontPreset] ?? FONT_STACKS.default;
  const radius = RADIUS_PX[settings.radiusPreset] ?? RADIUS_PX.comfortable;

  const tokens: ThemeTokens = {
    // Surfaces & text
    "--background": p.background,
    "--foreground": p.textPrimary,
    "--surface": p.surface,
    "--surface-2": p.muted,
    "--card": p.surface,
    "--card-foreground": p.textPrimary,
    "--popover": p.surface,
    "--popover-foreground": p.textPrimary,
    "--muted": p.muted,
    "--muted-foreground": p.textSecondary,
    // shadcn "secondary"/"accent" are neutral hover surfaces, not brand colours.
    "--secondary": p.muted,
    "--secondary-foreground": p.textPrimary,
    "--accent": p.muted,
    "--accent-foreground": p.textPrimary,
    "--border": p.border,
    "--border-strong": p.borderStrong,
    "--input": p.border,
    // Brand
    "--primary": primary,
    "--primary-hover": primaryHover,
    "--primary-foreground": primaryForeground,
    "--ring": primary,
    "--brand-secondary": secondary,
    "--brand-secondary-foreground": readableForeground(secondary),
    // Sidebar
    "--sidebar": sidebar.background,
    "--sidebar-foreground": sidebar.foreground,
    "--sidebar-muted": sidebar.muted,
    "--sidebar-accent": sidebar.accent,
    "--sidebar-accent-foreground": sidebar.foreground,
    "--sidebar-active-foreground": sidebarActive,
    "--sidebar-border": sidebar.border,
    "--sidebar-ring": sidebarPrimary,
    "--sidebar-primary": sidebarPrimary,
    "--sidebar-primary-foreground": readableForeground(sidebarPrimary),
    // Charts
    "--chart-1": primary,
    "--chart-2": secondary,
    "--chart-3": mix(primary, p.surface, 0.4),
    "--chart-4": mix(secondary, p.surface, 0.4),
    "--chart-5": mix(primary, secondary, 0.5),
    // Status
    ...STATUS[mode],
    // Shape & type
    "--radius": `${radius}px`,
    "--app-font-sans": fonts.sans,
    "--app-font-display": fonts.display,
  };

  return { tokens, adjustments };
}

function declarations(tokens: ThemeTokens): string {
  return Object.entries(tokens)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
}

/**
 * Serialises a theme for both appearance modes. `html:root` outranks the
 * defaults in globals.css regardless of stylesheet order.
 */
export function buildThemeCss(settings: ThemeSettings): string {
  const light = buildTheme(settings, "light").tokens;
  const dark = buildTheme(settings, "dark").tokens;
  return `html:root{${declarations(light)}}html:root.dark{${declarations(dark)}color-scheme:dark;}`;
}

/** Tokens whose Tailwind `--color-*` alias must also be set when scoping a theme to an element. */
const COLOR_TOKENS = [
  "background", "foreground", "surface", "surface-2", "card", "card-foreground", "popover",
  "popover-foreground", "muted", "muted-foreground", "secondary", "secondary-foreground", "accent",
  "accent-foreground", "border", "border-strong", "input", "primary", "primary-hover",
  "primary-foreground", "ring", "brand-secondary", "brand-secondary-foreground", "sidebar",
  "sidebar-foreground", "sidebar-muted", "sidebar-accent", "sidebar-accent-foreground", "sidebar-active-foreground",
  "sidebar-border", "sidebar-ring", "sidebar-primary", "sidebar-primary-foreground", "chart-1",
  "chart-2", "chart-3", "chart-4", "chart-5", "destructive", "destructive-foreground", "success",
  "warning", "info",
];

/** Declarations for a scoped theme: raw tokens plus their --color-* / font aliases. */
function scopedDeclarations(tokens: ThemeTokens, mode: ResolvedMode): string {
  const out: Record<string, string> = { ...tokens };
  for (const name of COLOR_TOKENS) {
    const value = tokens[`--${name}`];
    if (value) out[`--color-${name}`] = value;
  }
  out["--font-sans"] = tokens["--app-font-sans"];
  out["--font-display"] = tokens["--app-font-display"];
  return (
    Object.entries(out).map(([k, v]) => `${k}:${v};`).join("") +
    `color-scheme:${mode};color:${tokens["--foreground"]};font-family:${tokens["--app-font-sans"]};`
  );
}

/**
 * Static CSS that scopes a theme to elements matching `selector`, for both
 * modes. The dark variant keys off the `.dark` class the pre-paint script puts
 * on <html>, so server and client render identical markup and nothing flashes.
 */
export function buildScopedThemeCss(settings: ThemeSettings, selector: string): string {
  const light = buildTheme(settings, "light").tokens;
  const dark = buildTheme(settings, "dark").tokens;
  return `${selector}{${scopedDeclarations(light, "light")}}html.dark ${selector}{${scopedDeclarations(dark, "dark")}}`;
}

/**
 * Inline style that scopes a theme to one element (live preview, invitation
 * pages). Sets both the raw token and its `--color-*` alias, because aliases
 * defined on :root have already resolved there and would not pick up a
 * scoped override.
 */
export function themeStyle(settings: ThemeSettings, mode: ResolvedMode): CSSProperties {
  const { tokens } = buildTheme(settings, mode);
  const style: Record<string, string> = { ...tokens };
  for (const name of COLOR_TOKENS) {
    const value = tokens[`--${name}`];
    if (value) style[`--color-${name}`] = value;
  }
  style["--font-sans"] = tokens["--app-font-sans"];
  style["--font-display"] = tokens["--app-font-display"];
  style.colorScheme = mode;
  style.color = tokens["--foreground"];
  style.fontFamily = tokens["--app-font-sans"];
  return style as CSSProperties;
}
