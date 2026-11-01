"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app.store";
import {
  PLATFORM_BRANDING,
  applyAppearance,
  applyFavicon,
  applyThemeCss,
  buildThemeCss,
  writeThemeCache,
  type AppearanceMode,
  type ResolvedMode,
  type ThemeSettings,
} from "@/lib/theme";

interface ThemeContextValue {
  /** The appearance setting in effect: personal preference, else org default, else platform default. */
  appearance: AppearanceMode;
  /** Whether that appearance currently renders light or dark. */
  mode: ResolvedMode;
  /** Theme settings in effect (organization branding, or platform defaults when signed out). */
  settings: ThemeSettings;
  /** Brand shown in the app chrome. */
  brand: { name: string; logoUrl: string | null };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * The single theme provider for the app. Resolution order:
 *   platform defaults → organization branding → personal appearance preference
 *
 * Generates CSS custom properties for the resolved theme, applies them to
 * <html>, and caches them for the pre-paint script in app/layout.tsx.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const workspace = useAppStore((s) => s.workspace);
  const branding = isAuthenticated ? workspace?.branding ?? null : null;

  const settings: ThemeSettings = useMemo(
    () =>
      branding
        ? {
            themePreset: branding.themePreset,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            sidebarStyle: branding.sidebarStyle,
            fontPreset: branding.fontPreset,
            radiusPreset: branding.radiusPreset,
          }
        : PLATFORM_BRANDING.defaultTheme,
    [branding]
  );

  const appearance: AppearanceMode =
    (isAuthenticated && workspace
      ? workspace.preferences.appearance ?? workspace.branding.defaultAppearance
      : null) ?? PLATFORM_BRANDING.defaultAppearance;

  const css = useMemo(() => buildThemeCss(settings), [settings]);
  const favicon = branding?.faviconUrl ?? null;
  // Start from the server's value so hydration matches; the effect below
  // switches to the real mode immediately. Page colours never depend on this
  // (the pre-paint script handles them); only mode-aware widgets do.
  const [mode, setMode] = useState<ResolvedMode>("light");

  // Colour tokens
  useEffect(() => {
    applyThemeCss(css);
  }, [css]);

  // Light / dark, following the OS when set to "system"
  useEffect(() => {
    setMode(applyAppearance(appearance));
    if (appearance !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setMode(applyAppearance("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance]);

  useEffect(() => {
    applyFavicon(favicon);
  }, [favicon]);

  // Cache for the next full page load
  useEffect(() => {
    writeThemeCache({ css, appearance, favicon });
  }, [css, appearance, favicon]);

  const brandName = branding?.displayName ?? PLATFORM_BRANDING.productName;
  useEffect(() => {
    document.title = branding ? `${brandName} · ${PLATFORM_BRANDING.productName}` : PLATFORM_BRANDING.productName;
  }, [branding, brandName]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      appearance,
      mode,
      settings,
      brand: { name: brandName, logoUrl: branding?.logoUrl ?? null },
    }),
    [appearance, mode, settings, brandName, branding?.logoUrl]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
