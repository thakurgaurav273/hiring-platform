/**
 * Jobs widget for customer websites:
 *
 *   <script src="https://jobs.robintalent.in/embed.js" data-org="acme"></script>
 *
 * Optional attributes on the script tag:
 *   data-target  CSS selector of the element to render into (default: a box
 *                inserted right after the script tag, or #robin-talent-jobs)
 *   data-layout  "list" (default) or "grid"
 *   data-color   accent colour as #RRGGBB (default: the organization's brand colour)
 *   data-limit   maximum number of jobs to show
 *   data-scheme  "light" (default) or "auto" to follow the visitor's dark mode
 *
 * The widget renders inside a shadow root so the host page's CSS can't break
 * it and its CSS can't leak out. All text is set with textContent. It lists
 * only jobs published to the "Company website (embed)" destination, and links
 * go to the hosted job page tagged with the embed source.
 */
import { API_URL, SITE_URL } from "@/lib/careers";
import { PLATFORM_BRANDING, THEME_PRESET_LIST, buildTheme } from "@/lib/theme";

/**
 * Accent colour per theme preset (light mode, contrast-adjusted), so the
 * widget matches the careers page when an organization uses a preset
 * without a custom brand colour.
 */
const PRESET_ACCENTS: Record<string, string> = Object.fromEntries(
  THEME_PRESET_LIST.map((p) => [
    p.id,
    buildTheme({ ...PLATFORM_BRANDING.defaultTheme, themePreset: p.id, primaryColor: null, secondaryColor: null }, "light").tokens["--primary"],
  ])
);

export const dynamic = "force-static";
export const revalidate = 300;

function widgetSource(apiUrl: string, siteUrl: string, accents: Record<string, string>) {
  return `/* Robin Talent jobs widget */
(function () {
  "use strict";
  var API = ${JSON.stringify(apiUrl)};
  var SITE = ${JSON.stringify(siteUrl)};
  var PRESET_ACCENTS = ${JSON.stringify(accents)};
  var HEX = /^#[0-9a-fA-F]{6}$/;
  var script = document.currentScript;
  if (!script) {
    var all = document.querySelectorAll('script[src*="embed.js"][data-org]');
    script = all[all.length - 1];
  }
  if (!script) return;
  if (script.getAttribute("data-rt-mounted")) return;
  script.setAttribute("data-rt-mounted", "1");

  var org = (script.getAttribute("data-org") || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,63}$/.test(org)) { console.warn("[Robin Talent] Missing or invalid data-org on the embed script."); return; }
  var layout = script.getAttribute("data-layout") === "grid" ? "grid" : "list";
  var colorAttr = script.getAttribute("data-color") || "";
  var color = /^#[0-9a-fA-F]{6}$/.test(colorAttr) ? colorAttr : null;
  var limit = parseInt(script.getAttribute("data-limit") || "", 10);

  var host = null;
  var targetSel = script.getAttribute("data-target");
  if (targetSel) { try { host = document.querySelector(targetSel); } catch (e) {} }
  if (!host) host = document.getElementById("robin-talent-jobs");
  if (!host) { host = document.createElement("div"); script.parentNode.insertBefore(host, script.nextSibling); }

  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function slugify(s) {
    return (s.toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)) || "job";
  }
  var TYPES = { FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship" };

  var style = el("style");
  function css(accent) {
    return ":host{all:initial;display:block}" +
      ".rt{--a:" + accent + ";font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1f2937;font-size:15px;line-height:1.45}" +
      ".rt *{box-sizing:border-box}" +
      ".list{display:grid;gap:10px;margin:0;padding:0;list-style:none}" +
      ".grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}" +
      ".job{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;text-decoration:none;color:inherit;transition:border-color .15s,box-shadow .15s}" +
      ".grid .job{flex-direction:column;align-items:flex-start;height:100%}" +
      ".job:hover{border-color:var(--a);box-shadow:0 1px 6px rgba(0,0,0,.06)}" +
      ".job:focus-visible{outline:2px solid var(--a);outline-offset:2px}" +
      ".body{flex:1;min-width:0}" +
      ".title{font-weight:600;font-size:15px;margin:0;color:#111827}" +
      ".meta{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:3px;font-size:13px;color:#6b7280}" +
      ".cta{font-size:13px;font-weight:600;color:var(--a);white-space:nowrap}" +
      ".empty,.err{padding:16px;border:1px dashed #d1d5db;border-radius:10px;color:#6b7280;font-size:14px}" +
      ".foot{margin-top:10px;font-size:12px;color:#9ca3af}" +
      ".foot a{color:inherit}" +
      "@media (prefers-color-scheme:dark){.rt[data-scheme=auto]{color:#e5e7eb}.rt[data-scheme=auto] .job{background:#111827;border-color:#374151}.rt[data-scheme=auto] .title{color:#f9fafb}.rt[data-scheme=auto] .meta{color:#9ca3af}}";
  }
  var wrap = el("div", "rt");
  wrap.setAttribute("data-scheme", script.getAttribute("data-scheme") === "auto" ? "auto" : "light");
  style.textContent = css(color || "#374151");
  root.appendChild(style);
  root.appendChild(wrap);
  var loading = el("div", "empty", "Loading open roles…");
  wrap.appendChild(loading);

  fetch(API + "/public/careers/" + encodeURIComponent(org) + "?channel=embed", { credentials: "omit" })
    .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(function (payload) {
      var data = payload && payload.data;
      if (!data) throw new Error("bad payload");
      var b = data.organization.branding || {};
      if (!color) {
        var accent = HEX.test(b.primaryColor || "") ? b.primaryColor : PRESET_ACCENTS[b.themePreset];
        if (accent && HEX.test(accent)) style.textContent = css(accent);
      }
      wrap.removeChild(loading);
      var jobs = data.jobs || [];
      if (limit > 0) jobs = jobs.slice(0, limit);
      if (!jobs.length) {
        wrap.appendChild(el("div", "empty", "There are no open roles at " + data.organization.name + " right now."));
      } else {
        var ul = el("ul", "list" + (layout === "grid" ? " grid" : ""));
        ul.setAttribute("aria-label", "Open roles at " + data.organization.name);
        jobs.forEach(function (job) {
          var li = el("li");
          var a = el("a", "job");
          var url = new URL(SITE + "/careers/" + org + "/jobs/" + slugify(job.title) + "-" + job.id);
          url.searchParams.set("channel", "embed");
          url.searchParams.set("utm_source", "website");
          url.searchParams.set("utm_medium", "embed");
          a.href = url.toString();
          a.target = "_blank";
          a.rel = "noopener";
          var body = el("div", "body");
          body.appendChild(el("p", "title", job.title));
          var meta = el("div", "meta");
          [job.department, job.location, TYPES[job.employmentType]].forEach(function (m) { if (m) meta.appendChild(el("span", null, m)); });
          body.appendChild(meta);
          a.appendChild(body);
          a.appendChild(el("span", "cta", "View role →"));
          li.appendChild(a);
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }
      var foot = el("div", "foot");
      var all = el("a", null, "See all roles on our careers page");
      all.href = SITE + "/careers/" + org + "?utm_source=website&utm_medium=embed";
      all.target = "_blank";
      all.rel = "noopener";
      foot.appendChild(all);
      wrap.appendChild(foot);
    })
    .catch(function () {
      loading.className = "err";
      loading.textContent = "Open roles couldn't be loaded right now.";
    });
})();
`;
}

export function GET() {
  return new Response(widgetSource(API_URL, SITE_URL, PRESET_ACCENTS), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
