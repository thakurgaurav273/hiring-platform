"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ImageUp, LoaderCircle, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { useTheme } from "@/components/theme-provider";
import { OrgMark } from "@/components/brand";
import { SettingsCard } from "@/features/settings/SettingsSections";
import { organizationService, type BrandingAssetKind } from "@/services/api/organization.service";
import { buildTheme } from "@/lib/theme/engine";
import { isHexColor } from "@/lib/theme/color";
import { THEME_PRESETS, THEME_PRESET_LIST } from "@/lib/theme/presets";
import { DEFAULT_THEME_SETTINGS } from "@/lib/theme/platform";
import type {
  AppearanceMode,
  FontPreset,
  OrganizationBranding,
  RadiusPreset,
  ResolvedMode,
  SidebarStyle,
  ThemePresetId,
  ThemeSettings,
} from "@/lib/theme/types";
import { cn } from "@/lib/utils";
import { BrandingPreview } from "./BrandingPreview";
import { ColorField, OptionGroup } from "./controls";

// Client-side mirrors of the server rules (organization.constants.ts). The
// server re-validates everything, including the file's actual signature.
const ASSET_RULES: Record<BrandingAssetKind, { accept: string; types: string[]; maxBytes: number; hint: string }> = {
  logo: {
    accept: "image/png,image/jpeg,image/webp",
    types: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 2 * 1024 * 1024,
    hint: "PNG, JPEG or WebP, up to 2 MB. A square image of at least 128×128 works best.",
  },
  favicon: {
    accept: "image/png,image/x-icon,image/vnd.microsoft.icon,.ico",
    types: ["image/png", "image/x-icon", "image/vnd.microsoft.icon"],
    maxBytes: 512 * 1024,
    hint: "PNG or ICO, up to 512 KB. 32×32 or 64×64 recommended.",
  },
};

interface AssetDraft {
  /** A newly chosen file, uploaded on Apply. */
  file: File | null;
  /** Object URL for a chosen file, else the saved URL. */
  previewUrl: string | null;
  /** Remove the saved asset on Apply. */
  remove: boolean;
}

interface Draft extends ThemeSettings {
  displayName: string;
  defaultAppearance: AppearanceMode;
  logo: AssetDraft;
  favicon: AssetDraft;
}

const draftFrom = (b: OrganizationBranding): Draft => ({
  displayName: b.customDisplayName ?? "",
  themePreset: b.themePreset,
  primaryColor: b.primaryColor,
  secondaryColor: b.secondaryColor,
  sidebarStyle: b.sidebarStyle,
  fontPreset: b.fontPreset,
  radiusPreset: b.radiusPreset,
  defaultAppearance: b.defaultAppearance,
  logo: { file: null, previewUrl: b.logoUrl, remove: false },
  favicon: { file: null, previewUrl: b.faviconUrl, remove: false },
});

const SETTING_KEYS = [
  "themePreset",
  "primaryColor",
  "secondaryColor",
  "sidebarStyle",
  "fontPreset",
  "radiusPreset",
  "defaultAppearance",
] as const;

function isDirty(draft: Draft, saved: OrganizationBranding) {
  if ((draft.displayName.trim() || null) !== (saved.customDisplayName ?? null)) return true;
  if (SETTING_KEYS.some((k) => draft[k] !== saved[k])) return true;
  return !!(draft.logo.file || draft.logo.remove || draft.favicon.file || draft.favicon.remove);
}

export function BrandingSettings() {
  const workspace = useAppStore((s) => s.workspace);
  const setBranding = useAppStore((s) => s.setBranding);
  const queryClient = useQueryClient();
  const { mode: currentMode } = useTheme();
  const saved = workspace?.branding ?? null;
  const canManage = !!workspace?.permissions.canManageBranding;

  const [draft, setDraft] = useState<Draft | null>(saved ? draftFrom(saved) : null);
  const [previewMode, setPreviewMode] = useState<ResolvedMode>(currentMode);
  const [saving, setSaving] = useState(false);

  // Adopt server data when it first arrives or changes elsewhere, but never
  // overwrite unsaved edits.
  const lastSyncedAt = useRef(saved?.updatedAt);
  useEffect(() => {
    if (!saved) return;
    setDraft((current) => {
      if (!current || (!isDirty(current, saved) && lastSyncedAt.current !== saved.updatedAt)) {
        lastSyncedAt.current = saved.updatedAt;
        return draftFrom(saved);
      }
      return current;
    });
  }, [saved]);

  // Release the object URL of a chosen-but-unsaved file once it is replaced,
  // cleared or the page unmounts (one effect per asset so they don't interfere).
  const logoObjectUrl = draft?.logo.file ? draft.logo.previewUrl : null;
  const faviconObjectUrl = draft?.favicon.file ? draft.favicon.previewUrl : null;
  useEffect(() => () => { if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl); }, [logoObjectUrl]);
  useEffect(() => () => { if (faviconObjectUrl) URL.revokeObjectURL(faviconObjectUrl); }, [faviconObjectUrl]);

  const settings: ThemeSettings | null = useMemo(
    () =>
      draft && {
        themePreset: draft.themePreset,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        sidebarStyle: draft.sidebarStyle,
        fontPreset: draft.fontPreset,
        radiusPreset: draft.radiusPreset,
      },
    [draft]
  );

  const adjustments = useMemo(() => {
    if (!settings) return {};
    const light = buildTheme(settings, "light").adjustments;
    const dark = buildTheme(settings, "dark").adjustments;
    return { light, dark };
  }, [settings]);

  if (!saved || !draft || !settings) {
    return (
      <SettingsCard title="Branding & Appearance">
        <div className="flex items-center gap-2 py-6 text-[13px] text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading branding…
        </div>
      </SettingsCard>
    );
  }

  if (!canManage) {
    return (
      <SettingsCard title="Branding & Appearance">
        <p className="text-[13px] text-muted-foreground">
          Only the organization owner and administrators can change branding. Contact your administrator to request a
          change.
        </p>
      </SettingsCard>
    );
  }

  const dirty = isDirty(draft, saved);
  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const preset = THEME_PRESETS[draft.themePreset];
  const brandName = draft.displayName.trim() || saved.organizationName;
  const logoPreview = draft.logo.remove ? null : draft.logo.previewUrl;

  const chooseFile = (kind: BrandingAssetKind, file: File | undefined) => {
    if (!file) return;
    const rules = ASSET_RULES[kind];
    const typeOk = rules.types.includes(file.type) || (kind === "favicon" && file.name.toLowerCase().endsWith(".ico"));
    if (!typeOk) {
      toast.error(`Unsupported file type. ${rules.hint}`);
      return;
    }
    if (file.size > rules.maxBytes) {
      toast.error(`That file is too large. ${rules.hint}`);
      return;
    }
    update({ [kind]: { file, previewUrl: URL.createObjectURL(file), remove: false } } as Partial<Draft>);
  };

  const removeAsset = (kind: BrandingAssetKind) =>
    update({ [kind]: { file: null, previewUrl: null, remove: !!saved[kind === "logo" ? "logoUrl" : "faviconUrl"] } } as Partial<Draft>);

  const cancel = () => setDraft(draftFrom(saved));

  const resetToDefaults = () =>
    update({
      ...DEFAULT_THEME_SETTINGS,
      defaultAppearance: "system",
    });

  const apply = async () => {
    const hexes = [draft.primaryColor, draft.secondaryColor].filter((c) => c !== null);
    if (hexes.some((c) => !isHexColor(c))) {
      toast.error("Colours must be 6-digit HEX values, for example #4F46E5");
      return;
    }
    setSaving(true);
    try {
      let latest: OrganizationBranding = saved;
      for (const kind of ["logo", "favicon"] as const) {
        const asset = draft[kind];
        if (asset.file) latest = await organizationService.uploadAsset(kind, asset.file);
        else if (asset.remove) latest = await organizationService.removeAsset(kind);
      }
      latest = await organizationService.updateBranding({
        displayName: draft.displayName.trim() || null,
        themePreset: draft.themePreset,
        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        defaultAppearance: draft.defaultAppearance,
        sidebarStyle: draft.sidebarStyle,
        fontPreset: draft.fontPreset,
        radiusPreset: draft.radiusPreset,
      });
      lastSyncedAt.current = latest.updatedAt;
      setBranding(latest); // applies the new theme across the app
      setDraft(draftFrom(latest));
      toast.success("Branding updated for your organization");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Couldn't save branding");
    } finally {
      setSaving(false);
      // Re-read in case only some steps succeeded.
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
      <div className="space-y-6">
        {/* ── Brand identity ─────────────────────────────── */}
        <SettingsCard
          title="Brand identity"
          description="How your organization appears in the sidebar, header, browser tab and invitation emails."
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="brand-display-name" className="mb-1.5 block text-[12.5px] font-medium">
                Display name
              </label>
              <input
                id="brand-display-name"
                className="input"
                maxLength={80}
                value={draft.displayName}
                placeholder={saved.organizationName}
                onChange={(e) => update({ displayName: e.target.value })}
              />
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                Leave empty to use your organization name, “{saved.organizationName}”.
              </p>
            </div>

            <AssetField
              kind="logo"
              label="Logo"
              hint={ASSET_RULES.logo.hint}
              accept={ASSET_RULES.logo.accept}
              preview={<OrgMark name={brandName} logoUrl={logoPreview} size={56} className="rounded-lg" />}
              hasAsset={!!logoPreview}
              pending={!!draft.logo.file || draft.logo.remove}
              onChoose={(f) => chooseFile("logo", f)}
              onRemove={() => removeAsset("logo")}
            />

            <AssetField
              kind="favicon"
              label="Favicon (optional)"
              hint={ASSET_RULES.favicon.hint}
              accept={ASSET_RULES.favicon.accept}
              preview={
                draft.favicon.previewUrl && !draft.favicon.remove ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview / uploaded asset
                  <img src={draft.favicon.previewUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">Default</span>
                )
              }
              hasAsset={!!draft.favicon.previewUrl && !draft.favicon.remove}
              pending={!!draft.favicon.file || draft.favicon.remove}
              onChoose={(f) => chooseFile("favicon", f)}
              onRemove={() => removeAsset("favicon")}
            />
          </div>
        </SettingsCard>

        {/* ── Colours ────────────────────────────────────── */}
        <SettingsCard title="Colours" description="Start from a preset, then optionally set your own brand colours.">
          <div role="radiogroup" aria-label="Theme preset" className="grid gap-2.5 sm:grid-cols-2">
            {THEME_PRESET_LIST.map((p) => {
              const active = draft.themePreset === p.id;
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => update({ themePreset: p.id as ThemePresetId })}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                    active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border-strong"
                  )}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-md border border-border" aria-hidden="true">
                    {[p.light.primary, p.light.secondary, p.light.background, p.dark.background].map((c, i) => (
                      <span key={i} className="h-8 w-4" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{p.name}</span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">{p.description}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <ColorField
              id="brand-primary"
              label="Primary colour"
              help="Buttons, links, focus rings and highlights."
              value={draft.primaryColor}
              fallback={preset.light.primary}
              onChange={(primaryColor) => update({ primaryColor })}
              adjusted={adjustments.light?.primary}
            />
            <ColorField
              id="brand-secondary"
              label="Secondary colour"
              help="Charts and supporting accents."
              value={draft.secondaryColor}
              fallback={preset.light.secondary}
              onChange={(secondaryColor) => update({ secondaryColor })}
              adjusted={adjustments.light?.secondary}
            />
          </div>
        </SettingsCard>

        {/* ── Appearance ─────────────────────────────────── */}
        <SettingsCard
          title="Appearance"
          description="Organization-wide defaults. Members can still choose light or dark mode for themselves."
        >
          <div className="space-y-5">
            <OptionGroup<AppearanceMode>
              label="Default appearance"
              value={draft.defaultAppearance}
              onChange={(defaultAppearance) => update({ defaultAppearance })}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ]}
            />
            <OptionGroup<SidebarStyle>
              label="Sidebar style"
              value={draft.sidebarStyle}
              onChange={(sidebarStyle) => update({ sidebarStyle })}
              options={[
                { value: "solid", label: "Solid", hint: preset.light.sidebar ? "Preset colour" : "Surface" },
                { value: "subtle", label: "Subtle", hint: "Tinted" },
                { value: "transparent", label: "Transparent", hint: "Blends in" },
              ]}
            />
            <OptionGroup<FontPreset>
              label="Font"
              value={draft.fontPreset}
              onChange={(fontPreset) => update({ fontPreset })}
              options={[
                { value: "default", label: "Default", hint: "Inter", fontVar: "var(--font-inter)" },
                { value: "modern", label: "Modern", hint: "Geist", fontVar: "var(--font-geist)" },
                { value: "classic", label: "Classic", hint: "Serif headings", fontVar: "var(--font-serif)" },
              ]}
            />
            <OptionGroup<RadiusPreset>
              label="Corner radius"
              value={draft.radiusPreset}
              onChange={(radiusPreset) => update({ radiusPreset })}
              options={[
                { value: "compact", label: "Compact", radius: 4 },
                { value: "comfortable", label: "Comfortable", radius: 8 },
                { value: "rounded", label: "Rounded", radius: 12 },
              ]}
            />
          </div>
        </SettingsCard>
      </div>

      {/* ── Preview + actions ───────────────────────────── */}
      <div className="xl:sticky xl:top-4 xl:self-start">
        <SettingsCard
          title="Preview"
          description={dirty ? "Showing unsaved changes." : "Showing your saved branding."}
          action={
            <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Preview mode">
              {(["light", "dark"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPreviewMode(m)}
                  aria-pressed={previewMode === m}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium capitalize transition",
                    previewMode === m ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {m}
                </button>
              ))}
            </div>
          }
        >
          <BrandingPreview settings={settings} mode={previewMode} brand={{ name: brandName, logoUrl: logoPreview }} />

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
              title="Restore the Robin Labs default theme. Your name and logo are kept."
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={cancel}
              disabled={!dirty || saving}
              className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] font-medium transition hover:bg-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!dirty || saving}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            >
              {saving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Apply changes
            </button>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Changes apply to everyone in {saved.organizationName}. Platform attribution is managed by Robin Labs.
          </p>
        </SettingsCard>
      </div>
    </div>
  );
}

function AssetField({
  kind,
  label,
  hint,
  accept,
  preview,
  hasAsset,
  pending,
  onChoose,
  onRemove,
}: {
  kind: BrandingAssetKind;
  label: string;
  hint: string;
  accept: string;
  preview: ReactNode;
  hasAsset: boolean;
  pending: boolean;
  onChoose: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `brand-${kind}-file`;
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-medium">{label}</div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg border border-dashed border-border-strong bg-surface-2">
          {preview}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                onChoose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[12.5px] font-medium transition hover:bg-secondary"
            >
              <ImageUp className="h-3.5 w-3.5" /> {hasAsset ? "Replace" : "Upload"}
            </button>
            {hasAsset && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground">
            {hint}
            {pending && <span className="ml-1 font-medium text-foreground">Saved when you apply changes.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
