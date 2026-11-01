/**
 * Small, dependency-free colour helpers for the theme engine.
 * All inputs and outputs are 6-digit HEX strings (#RRGGBB).
 */

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  if (!isHexColor(hex)) throw new Error(`Invalid HEX colour: ${hex}`);
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** Linear blend: amount 0 returns `a`, 1 returns `b`. */
export function mix(a: string, b: string, amount: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * amount) as RGB);
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const DARK_TEXT = "#0F172A";
export const LIGHT_TEXT = "#FFFFFF";

/** Picks whichever of white or near-black text reads better on `background`. */
export function readableForeground(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}

/**
 * Returns `color`, darkened or lightened just enough to reach `ratio` against
 * every colour in `against`. The direction follows the backgrounds: light
 * backgrounds darken the colour, dark backgrounds lighten it.
 */
export function ensureContrast(
  color: string,
  against: string | string[],
  ratio: number
): { color: string; adjusted: boolean } {
  const backgrounds = Array.isArray(against) ? against : [against];
  const meets = (c: string) => backgrounds.every((bg) => contrastRatio(c, bg) >= ratio);
  if (meets(color)) return { color: color.toUpperCase(), adjusted: false };

  const avgLum = backgrounds.reduce((s, bg) => s + luminance(bg), 0) / backgrounds.length;
  const target = avgLum > 0.5 ? "#000000" : "#FFFFFF";
  for (let step = 1; step <= 50; step++) {
    const candidate = mix(color, target, step / 50);
    if (meets(candidate)) return { color: candidate, adjusted: true };
  }
  return { color: target === "#000000" ? DARK_TEXT : LIGHT_TEXT, adjusted: true };
}
