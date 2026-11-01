import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildScopedThemeCss, buildTheme, buildThemeCss, themeStyle, RADIUS_PX } from "../engine";
import { contrastRatio, ensureContrast, mix, readableForeground } from "../color";
import { DEFAULT_THEME_SETTINGS } from "../platform";
import type { ThemeSettings } from "../types";

const css = readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf8");

function block(selector: string): Record<string, string> {
  const re = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`);
  const body = css.match(re)?.[1] ?? "";
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
}

const settings = (patch: Partial<ThemeSettings> = {}): ThemeSettings => ({ ...DEFAULT_THEME_SETTINGS, ...patch });

describe("globals.css defaults", () => {
  // The static CSS is what paints before any script runs. It must equal the
  // engine's output for the Robin Labs default theme, or the first paint
  // would differ from the hydrated theme.
  it.each(["light", "dark"] as const)("matches the engine's default-preset %s tokens", (mode) => {
    const declared = block(mode === "light" ? ":root" : ".dark");
    const { tokens } = buildTheme(DEFAULT_THEME_SETTINGS, mode);
    const colorTokens = Object.entries(tokens).filter(([k]) => !k.startsWith("--app-font") && k !== "--radius");
    expect(colorTokens.length).toBeGreaterThan(30);
    for (const [name, value] of colorTokens) {
      expect(declared[name], name).toBe(value);
    }
  });

  it("defaults to Warm Professional with the Robin Labs brand palette", () => {
    expect(DEFAULT_THEME_SETTINGS.themePreset).toBe("warm_professional");
    const { tokens, adjustments } = buildTheme(DEFAULT_THEME_SETTINGS, "light");
    expect(adjustments).toEqual({});
    expect(tokens).toMatchObject({
      "--primary": "#A8320C",
      "--ring": "#A8320C",
      "--background": "#FAF9F6",
      "--surface": "#FFFFFF",
      "--foreground": "#222222",
      "--muted-foreground": "#737373",
      "--border": "#EAE7E1",
      "--muted": "#F3F1ED",
      "--primary-foreground": "#FFFFFF",
    });
  });

  it("keeps large surfaces neutral: terracotta only on interactive accents", () => {
    const { tokens } = buildTheme(DEFAULT_THEME_SETTINGS, "light");
    // Page, cards, sidebar and neutral hover surfaces are not the brand colour…
    for (const t of ["--background", "--surface", "--card", "--sidebar", "--sidebar-accent", "--secondary", "--accent", "--muted"] as const) {
      expect(tokens[t], t).not.toBe("#A8320C");
    }
    // …while buttons, links, focus and active navigation are.
    expect(tokens["--sidebar-primary"]).toBe("#A8320C");
    expect(tokens["--sidebar-active-foreground"]).toBe("#A8320C");
  });

  it("still provides Modern Enterprise as a selectable preset", () => {
    const { tokens } = buildTheme(settings({ themePreset: "modern_enterprise" }), "light");
    expect(tokens).toMatchObject({ "--primary": "#4F46E5", "--background": "#F8FAFC" });
  });

  it("has no hardcoded green brand colours left", () => {
    expect(css).not.toMatch(/#19C38C|#14B07D|#0F766E|#34C759/i);
  });
});

describe("buildTheme", () => {
  it("applies a custom primary colour and derives hover and foreground", () => {
    const { tokens, adjustments } = buildTheme(settings({ primaryColor: "#0E7490" }), "light");
    expect(tokens["--primary"]).toBe("#0E7490");
    expect(tokens["--primary-hover"]).not.toBe("#0E7490");
    expect(tokens["--primary-foreground"]).toBe("#FFFFFF");
    expect(adjustments.primary).toBeUndefined();
  });

  it("adjusts a low-contrast custom primary to meet WCAG AA", () => {
    const { tokens, adjustments } = buildTheme(settings({ primaryColor: "#FDE047" }), "light");
    expect(adjustments.primary).toBe(tokens["--primary"]);
    expect(contrastRatio(tokens["--primary"], tokens["--surface"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens["--primary"], tokens["--background"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(tokens["--primary"], tokens["--primary-foreground"])).toBeGreaterThanOrEqual(4.5);
  });

  it("lightens a dark custom primary in dark mode", () => {
    const { tokens } = buildTheme(settings({ primaryColor: "#1E1B4B" }), "dark");
    expect(contrastRatio(tokens["--primary"], tokens["--surface"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps brand secondary at 3:1 for charts", () => {
    const { tokens } = buildTheme(settings({ secondaryColor: "#E0F2FE" }), "light");
    expect(contrastRatio(tokens["--brand-secondary"], tokens["--surface"])).toBeGreaterThanOrEqual(3);
    expect(tokens["--chart-2"]).toBe(tokens["--brand-secondary"]);
  });

  it("does not let brand colours leak into neutral shadcn surfaces", () => {
    const { tokens } = buildTheme(settings({ secondaryColor: "#DB2777" }), "light");
    expect(tokens["--secondary"]).toBe(tokens["--muted"]);
    expect(tokens["--accent"]).toBe(tokens["--muted"]);
  });

  it.each(["solid", "subtle", "transparent"] as const)("produces a readable %s sidebar", (sidebarStyle) => {
    for (const mode of ["light", "dark"] as const) {
      const { tokens } = buildTheme(settings({ sidebarStyle }), mode);
      expect(contrastRatio(tokens["--sidebar-foreground"], tokens["--sidebar"])).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens["--sidebar-primary"], tokens["--sidebar"])).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses the preset's dedicated sidebar for solid style", () => {
    expect(buildTheme(settings({ themePreset: "corporate" }), "light").tokens["--sidebar"]).toBe("#0B1F3A");
    expect(buildTheme(settings({ themePreset: "corporate", sidebarStyle: "transparent" }), "light").tokens["--sidebar"]).toBe(
      "#F7F9FC"
    );
  });

  it("maps radius and font presets to tokens", () => {
    expect(buildTheme(settings({ radiusPreset: "compact" }), "light").tokens["--radius"]).toBe(`${RADIUS_PX.compact}px`);
    expect(buildTheme(settings({ radiusPreset: "rounded" }), "light").tokens["--radius"]).toBe(`${RADIUS_PX.rounded}px`);
    expect(buildTheme(settings({ fontPreset: "classic" }), "light").tokens["--app-font-display"]).toContain("--font-serif");
    expect(buildTheme(settings({ fontPreset: "modern" }), "light").tokens["--app-font-sans"]).toContain("--font-geist");
  });

  it("falls back to the default preset for an unknown preset", () => {
    const { tokens } = buildTheme(settings({ themePreset: "nope" as never }), "light");
    expect(tokens["--primary"]).toBe("#A8320C");
  });

  it("keeps the active navigation label readable on its highlight", () => {
    for (const themePreset of ["warm_professional", "corporate", "minimal", "modern_enterprise", "midnight"] as const) {
      for (const mode of ["light", "dark"] as const) {
        const { tokens } = buildTheme(settings({ themePreset }), mode);
        expect(contrastRatio(tokens["--sidebar-active-foreground"], tokens["--sidebar-accent"])).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("buildThemeCss / themeStyle", () => {
  it("emits both modes with selectors that outrank the defaults", () => {
    const out = buildThemeCss(settings({ themePreset: "midnight" }));
    expect(out).toMatch(/^html:root\{/);
    expect(out).toContain("html:root.dark{");
    expect(out).toContain("--primary:#4338CA;");
    expect(out).toContain("--primary:#818CF8;");
  });

  it("is deterministic, so cache comparisons are stable", () => {
    expect(buildThemeCss(settings({ primaryColor: "#123456" }))).toBe(buildThemeCss(settings({ primaryColor: "#123456" })));
  });

  it("builds static scoped CSS for both modes (used by the public website)", () => {
    const out = buildScopedThemeCss(DEFAULT_THEME_SETTINGS, '[data-theme-scope="platform"]');
    expect(out).toMatch(/^\[data-theme-scope="platform"\]\{/);
    expect(out).toContain('html.dark [data-theme-scope="platform"]{');
    expect(out).toContain("--color-primary:#A8320C;");
    expect(out).toContain("--color-primary:#E8825F;");
    expect(out).toContain("color-scheme:dark;");
  });

  it("scopes tokens and their Tailwind --color-* aliases", () => {
    const style = themeStyle(settings({ themePreset: "corporate" }), "dark") as Record<string, string>;
    expect(style["--primary"]).toBe("#60A5FA");
    expect(style["--color-primary"]).toBe("#60A5FA");
    expect(style["--color-border"]).toBe(style["--border"]);
    expect(style.colorScheme).toBe("dark");
  });
});

describe("color helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("picks the more readable foreground", () => {
    expect(readableForeground("#4F46E5")).toBe("#FFFFFF");
    expect(readableForeground("#FDE047")).toBe("#0F172A");
  });

  it("mixes colours linearly", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });

  it("leaves compliant colours unchanged", () => {
    expect(ensureContrast("#4F46E5", "#FFFFFF", 4.5)).toEqual({ color: "#4F46E5", adjusted: false });
  });
});
