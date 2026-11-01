"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageUp, Moon, RotateCcw, Sun, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { BrandingPreview } from "@/features/settings/branding/BrandingPreview";
import { ColorField, OptionGroup } from "@/features/settings/branding/controls";
import { buildTheme } from "@/lib/theme/engine";
import { contrastRatio } from "@/lib/theme/color";
import { THEME_PRESETS, THEME_PRESET_LIST } from "@/lib/theme/presets";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import type { FontPreset, RadiusPreset, ResolvedMode, SidebarStyle, ThemePresetId, ThemeSettings } from "@/lib/theme/types";
import { cn } from "@/lib/utils";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Lets website visitors try the real theme engine with their own brand.
 * Everything stays in the browser: nothing is uploaded or saved.
 */
export function BrandPlayground() {
  const { mode: siteMode } = useTheme();
  const [name, setName] = useState("Your company");
  const [settings, setSettings] = useState<ThemeSettings>(PLATFORM_BRANDING.defaultTheme);
  const [mode, setMode] = useState<ResolvedMode | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewMode = mode ?? siteMode;

  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo); }, [logo]);

  const update = (patch: Partial<ThemeSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const preset = THEME_PRESETS[settings.themePreset];

  const check = useMemo(() => {
    const { tokens, adjustments } = buildTheme(settings, previewMode);
    return {
      primary: tokens["--primary"],
      buttonText: contrastRatio(tokens["--primary"], tokens["--primary-foreground"]),
      onSurface: contrastRatio(tokens["--primary"], tokens["--surface"]),
      adjusted: adjustments.primary,
    };
  }, [settings, previewMode]);

  const reset = () => {
    setSettings(PLATFORM_BRANDING.defaultTheme);
    setName("Your company");
    setMode(null);
    setLogo(null);
  };

  const chooseLogo = (file: File | undefined) => {
    if (!file || !LOGO_TYPES.includes(file.type) || file.size > 2 * 1024 * 1024) return;
    setLogo(URL.createObjectURL(file));
  };

  return (
    // overflow-clip (not overflow-hidden) keeps the rounded corners without
    // creating a scroll container, so the preview below can stay sticky.
    <div className="grid overflow-clip rounded-2xl border border-border bg-surface lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Controls */}
      <div className="space-y-5 border-t border-border p-5 sm:p-6 lg:border-r lg:border-t-0">
        <div>
          <label htmlFor="pg-name" className="mb-1.5 block text-[12.5px] font-medium">
            Company name & logo
          </label>
          <div className="flex gap-2">
            <input id="pg-name" className="input min-w-0 flex-1" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
            <input
              ref={fileRef}
              type="file"
              accept={LOGO_TYPES.join(",")}
              className="sr-only"
              aria-label="Try your logo"
              onChange={(e) => {
                chooseLogo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {logo ? (
              <button
                type="button"
                onClick={() => setLogo(null)}
                aria-label="Remove logo"
                title="Remove logo"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Try your logo"
                title="Try your logo"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] border border-border bg-background hover:bg-secondary"
              >
                <ImageUp className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">Logos stay in your browser. Nothing is uploaded.</p>
        </div>

        <div>
          <div className="mb-2 text-[12.5px] font-medium">Preset</div>
          <div role="radiogroup" aria-label="Preset" className="grid grid-cols-5 gap-2">
            {THEME_PRESET_LIST.map((p) => {
              const active = settings.themePreset === p.id && !settings.primaryColor && !settings.secondaryColor;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={p.name}
                  aria-label={p.name}
                  // A preset click clears custom colours so the preset shows as designed.
                  onClick={() => update({ themePreset: p.id as ThemePresetId, primaryColor: null, secondaryColor: null })}
                  className={cn(
                    "flex aspect-square overflow-hidden rounded-lg border-2 transition",
                    settings.themePreset === p.id ? "border-foreground" : "border-transparent hover:border-border-strong"
                  )}
                >
                  <span className="flex-1" style={{ background: p.light.primary }} />
                  <span className="flex w-1/3 flex-col">
                    <span className="flex-1" style={{ background: p.light.background }} />
                    <span className="flex-1" style={{ background: p.dark.background }} />
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground">{preset.name}</span>: {preset.description}
          </p>
        </div>

        <ColorField
          id="pg-primary"
          label="Brand colour"
          help="Buttons, links, active states."
          value={settings.primaryColor}
          fallback={preset.light.primary}
          onChange={(primaryColor) => update({ primaryColor })}
        />
        <ColorField
          id="pg-secondary"
          label="Accent colour"
          help="Charts and accents."
          value={settings.secondaryColor}
          fallback={preset.light.secondary}
          onChange={(secondaryColor) => update({ secondaryColor })}
        />

        <OptionGroup<SidebarStyle>
          label="Sidebar"
          value={settings.sidebarStyle}
          onChange={(sidebarStyle) => update({ sidebarStyle })}
          options={[
            { value: "solid", label: "Solid" },
            { value: "subtle", label: "Subtle" },
            { value: "transparent", label: "Clear" },
          ]}
        />
        <OptionGroup<FontPreset>
          label="Font"
          value={settings.fontPreset}
          onChange={(fontPreset) => update({ fontPreset })}
          options={[
            { value: "default", label: "Inter", fontVar: "var(--font-inter)" },
            { value: "modern", label: "Geist", fontVar: "var(--font-geist)" },
            { value: "classic", label: "Serif", fontVar: "var(--font-serif)" },
          ]}
        />
        <OptionGroup<RadiusPreset>
          label="Corners"
          value={settings.radiusPreset}
          onChange={(radiusPreset) => update({ radiusPreset })}
          options={[
            { value: "compact", label: "Sharp", radius: 4 },
            { value: "comfortable", label: "Soft", radius: 8 },
            { value: "rounded", label: "Round", radius: 12 },
          ]}
        />

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start over
        </button>
      </div>

      {/* Preview */}
      <div className="order-first min-w-0 bg-background lg:order-none">
        <div className="p-4 sm:p-6 lg:sticky lg:top-16">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12.5px] text-muted-foreground" aria-live="polite">
            Primary <span className="font-mono text-foreground">{check.primary}</span> · {check.buttonText.toFixed(1)}:1 on
            buttons · {check.onSurface.toFixed(1)}:1 as text
            {check.adjusted && <span className="ml-1 text-foreground">(darkened to pass WCAG AA)</span>}
          </div>
          <div className="inline-flex rounded-md border border-border bg-surface p-0.5" role="group" aria-label="Preview mode">
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={previewMode === m}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded px-2.5 text-[12px] font-medium capitalize",
                  previewMode === m ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {m}
              </button>
            ))}
          </div>
        </div>
        <BrandingPreview tall settings={settings} mode={previewMode} brand={{ name: name.trim() || "Your company", logoUrl: logo }} />
        </div>
      </div>
    </div>
  );
}
