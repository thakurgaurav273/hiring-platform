import { describe, expect, it } from "vitest";
import { THEME_BOOTSTRAP_SCRIPT, THEME_STORAGE_KEY } from "../runtime";
import { buildThemeCss } from "../engine";
import { DEFAULT_THEME_SETTINGS } from "../platform";

/**
 * Runs the pre-paint bootstrap script against a minimal fake DOM, the way the
 * browser runs it while parsing <head>.
 */
function runBootstrap({ cache, prefersDark = false }: { cache?: unknown; prefersDark?: boolean }) {
  const classes = new Set<string>();
  const appended: { tag: string; id?: string; textContent?: string; rel?: string; href?: string }[] = [];
  const root = {
    classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
    style: {} as Record<string, string>,
  };
  const document = {
    documentElement: root,
    head: { appendChild: (el: (typeof appended)[number]) => appended.push(el) },
    createElement: (tag: string) => ({ tag }),
  };
  const store = new Map<string, string>();
  if (cache !== undefined) store.set(THEME_STORAGE_KEY, typeof cache === "string" ? cache : JSON.stringify(cache));
  const localStorage = { getItem: (k: string) => store.get(k) ?? null };
  const window = { matchMedia: () => ({ matches: prefersDark }) };

  new Function("document", "localStorage", "window", THEME_BOOTSTRAP_SCRIPT)(document, localStorage, window);
  return { dark: classes.has("dark"), colorScheme: root.style.colorScheme, appended };
}

describe("theme bootstrap script", () => {
  const css = buildThemeCss({ ...DEFAULT_THEME_SETTINGS, themePreset: "corporate" });

  it("re-applies the cached organization theme before paint", () => {
    const { appended, dark } = runBootstrap({ cache: { v: 1, css, appearance: "light", favicon: null } });
    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({ tag: "style", id: "rl-theme", textContent: css });
    expect(dark).toBe(false);
  });

  it("applies a cached dark appearance", () => {
    const { dark, colorScheme } = runBootstrap({ cache: { v: 1, css, appearance: "dark", favicon: null } });
    expect(dark).toBe(true);
    expect(colorScheme).toBe("dark");
  });

  it("follows the OS for system appearance", () => {
    expect(runBootstrap({ cache: { v: 1, css, appearance: "system", favicon: null }, prefersDark: true }).dark).toBe(true);
    expect(runBootstrap({ cache: { v: 1, css, appearance: "system", favicon: null }, prefersDark: false }).dark).toBe(false);
  });

  it("restores the organization favicon", () => {
    const { appended } = runBootstrap({
      cache: { v: 1, css, appearance: "light", favicon: "https://cdn.example.com/f.png" },
    });
    expect(appended.find((e) => e.id === "rl-favicon")).toMatchObject({ rel: "icon", href: "https://cdn.example.com/f.png" });
  });

  it("falls back to platform defaults without a cache, following the OS", () => {
    const { appended, dark } = runBootstrap({ prefersDark: true });
    expect(appended).toHaveLength(0);
    expect(dark).toBe(true);
  });

  it("ignores corrupt or outdated caches instead of throwing", () => {
    expect(() => runBootstrap({ cache: "{not json" })).not.toThrow();
    const { appended } = runBootstrap({ cache: { v: 0, css, appearance: "dark" } });
    expect(appended).toHaveLength(0);
  });
});
