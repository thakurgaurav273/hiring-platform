import { describe, expect, it } from "vitest";
import { THEME_PRESETS, THEME_PRESET_LIST } from "../presets";
import { buildTheme } from "../engine";
import { contrastRatio } from "../color";
import { DEFAULT_THEME_SETTINGS } from "../platform";
import { THEME_PRESET_IDS } from "../types";

// WCAG AA: 4.5:1 for normal text, 3:1 for UI components and graphics.
const AA_TEXT = 4.5;
const AA_UI = 3;

describe("theme presets", () => {
  it("provides the five built-in presets", () => {
    expect(Object.keys(THEME_PRESETS).sort()).toEqual([...THEME_PRESET_IDS].sort());
    // Default first, then the rest.
    expect(THEME_PRESET_LIST.map((p) => p.name)).toEqual([
      "Warm Professional",
      "Modern Enterprise",
      "Corporate",
      "Minimal",
      "Midnight",
    ]);
  });

  for (const preset of THEME_PRESET_LIST) {
    for (const mode of ["light", "dark"] as const) {
      describe(`${preset.name} (${mode})`, () => {
        const p = preset[mode];

        it("defines every token as a 6-digit HEX colour", () => {
          const values = [
            p.primary, p.primaryHover, p.secondary, p.background, p.surface, p.muted,
            p.textPrimary, p.textSecondary, p.border, p.borderStrong,
            ...(p.sidebar ? Object.values(p.sidebar) : []),
          ];
          for (const v of values) expect(v).toMatch(/^#[0-9A-F]{6}$/);
        });

        it("has AA body and secondary text on page and card surfaces", () => {
          for (const bg of [p.background, p.surface, p.muted]) {
            expect(contrastRatio(p.textPrimary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
          }
          for (const bg of [p.background, p.surface]) {
            expect(contrastRatio(p.textSecondary, bg)).toBeGreaterThanOrEqual(AA_TEXT);
          }
        });

        it("has an AA primary colour for links and buttons without adjustment", () => {
          const { tokens, adjustments } = buildTheme({ ...DEFAULT_THEME_SETTINGS, themePreset: preset.id }, mode);
          expect(adjustments.primary).toBeUndefined();
          expect(tokens["--primary"]).toBe(p.primary);
          expect(contrastRatio(p.primary, p.surface)).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(tokens["--primary"], tokens["--primary-foreground"])).toBeGreaterThanOrEqual(AA_TEXT);
          expect(contrastRatio(p.primaryHover, tokens["--primary-foreground"])).toBeGreaterThanOrEqual(AA_TEXT);
        });

        it("has a visible secondary colour for charts", () => {
          expect(contrastRatio(p.secondary, p.surface)).toBeGreaterThanOrEqual(AA_UI);
        });

        if (p.sidebar) {
          it("has a readable dedicated sidebar", () => {
            expect(contrastRatio(p.sidebar!.foreground, p.sidebar!.background)).toBeGreaterThanOrEqual(AA_TEXT);
            expect(contrastRatio(p.sidebar!.foreground, p.sidebar!.accent)).toBeGreaterThanOrEqual(AA_TEXT);
            expect(contrastRatio(p.sidebar!.muted, p.sidebar!.background)).toBeGreaterThanOrEqual(AA_TEXT);
          });
        }
      });
    }
  }
});
