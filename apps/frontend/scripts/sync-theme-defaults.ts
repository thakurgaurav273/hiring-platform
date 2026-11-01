/**
 * Regenerates the default-theme token blocks (:root / .dark) in
 * app/globals.css from the theme engine, so the static first paint always
 * matches the platform default preset.
 *
 *   npm run theme:sync
 *
 * lib/theme/__tests__/engine.test.ts fails if the two drift apart.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildTheme } from "../lib/theme/engine";
import { DEFAULT_THEME_SETTINGS } from "../lib/theme/platform";
import { THEME_PRESETS } from "../lib/theme/presets";

const file = path.resolve(__dirname, "../app/globals.css");
const css = readFileSync(file, "utf8");
const presetName = THEME_PRESETS[DEFAULT_THEME_SETTINGS.themePreset].name;

const tokens = (mode: "light" | "dark") =>
  Object.entries(buildTheme(DEFAULT_THEME_SETTINGS, mode).tokens)
    .filter(([k]) => !k.startsWith("--app-font") && k !== "--radius")
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

const light = `/* Robin Labs default theme: ${presetName} (light) */
:root {
  --radius: 10px;
  --app-font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --app-font-display: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

${tokens("light")}
}`;

const dark = `/* Robin Labs default theme: ${presetName} (dark) */
.dark {
  color-scheme: dark;
${tokens("dark")}
}`;

const lightRe = /\/\* Robin Labs default theme:[^*]*\(light\) \*\/\n:root \{[^}]*\}/;
const darkRe = /\/\* Robin Labs default theme:[^*]*\(dark\) \*\/\n\.dark \{[^}]*\}/;
if (!lightRe.test(css) || !darkRe.test(css)) {
  throw new Error("Could not find the default theme blocks in app/globals.css");
}
writeFileSync(file, css.replace(lightRe, light).replace(darkRe, dark));
console.log(`globals.css defaults synced to "${presetName}".`);
