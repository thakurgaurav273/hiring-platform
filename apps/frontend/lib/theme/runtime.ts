/**
 * Browser-side theme application and the pre-paint cache.
 *
 * The last applied theme is cached in localStorage. An inline script in
 * <head> (THEME_BOOTSTRAP_SCRIPT, rendered by app/layout.tsx) re-applies it
 * synchronously while the HTML is parsed, before the first paint, so
 * reloads never flash the default theme or the wrong light/dark mode.
 */
import type { AppearanceMode, ResolvedMode } from "./types";

export const THEME_STORAGE_KEY = "rl-theme";
const STYLE_ID = "rl-theme";
const FAVICON_ID = "rl-favicon";

export interface ThemeCache {
  v: 1;
  css: string;
  appearance: AppearanceMode;
  favicon: string | null;
}

/**
 * Must stay self-contained: it runs before any bundle loads. Keep it in sync
 * with applyThemeCss / applyAppearance / applyFavicon below.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var d=document.documentElement,s=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)})||"null");if(!s||s.v!==1)s=null;var a=(s&&s.appearance)||"system";if(s&&s.css){var e=document.createElement("style");e.id=${JSON.stringify(
  STYLE_ID
)};e.textContent=s.css;document.head.appendChild(e)}var k=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);d.classList.toggle("dark",k);d.style.colorScheme=k?"dark":"light";if(s&&s.favicon){var l=document.createElement("link");l.id=${JSON.stringify(
  FAVICON_ID
)};l.rel="icon";l.href=s.favicon;document.head.appendChild(l)}}catch(e){}})();`;

export function resolveMode(appearance: AppearanceMode): ResolvedMode {
  if (appearance === "light" || appearance === "dark") return appearance;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeCss(css: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

export function applyAppearance(appearance: AppearanceMode): ResolvedMode {
  const mode = resolveMode(appearance);
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  return mode;
}

export function applyFavicon(url: string | null) {
  const existing = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
  if (!url) {
    existing?.remove();
    return;
  }
  const link = existing ?? document.createElement("link");
  link.id = FAVICON_ID;
  link.rel = "icon";
  if (link.getAttribute("href") !== url) link.href = url;
  if (!existing) document.head.appendChild(link);
}

export function writeThemeCache(cache: Omit<ThemeCache, "v">) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ v: 1, ...cache }));
  } catch {
    // Storage may be unavailable (private mode, quota). The theme still applies for this page.
  }
}
