/**
 * Shared helpers for the public careers pages, the embed widget and the
 * distribution panel. Server- and client-safe.
 */
import type { FontPreset, RadiusPreset, ThemePresetId, AppearanceMode } from "@/lib/theme/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/** Public site origin, used for canonical URLs, share links and the embed snippet. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export interface PublicOrganization {
  slug: string;
  name: string;
  about: string | null;
  branding: {
    logoUrl: string | null;
    faviconUrl: string | null;
    themePreset: ThemePresetId;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontPreset: FontPreset;
    radiusPreset: RadiusPreset;
    defaultAppearance: AppearanceMode;
  };
}

export interface PublicJobSummary {
  id: string;
  title: string;
  department: string;
  location: string | null;
  employmentType: EmploymentType;
  experience: string | null;
  skills: string[];
  numOpenings: number;
  applicationDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationQuestion {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "yes_no" | "single_choice";
  options?: string[];
  required: boolean;
}

export interface PublicJob extends PublicJobSummary {
  description: string;
  questions: ApplicationQuestion[];
}

export interface CareersListing {
  organization: PublicOrganization;
  jobs: PublicJobSummary[];
  filters: { departments: string[]; locations: string[]; employmentTypes: EmploymentType[] };
}

export interface CareersJobDetail {
  organization: PublicOrganization;
  job: PublicJob;
  consentVersion: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "job";

/** SEO-friendly job path segment: "senior-frontend-developer-<uuid>". */
export const jobSlug = (job: { id: string; title: string }) => `${slugify(job.title)}-${job.id}`;

/** Extracts the job id from a job path segment. */
export const jobIdFromSlug = (slug: string) => {
  const m = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  return m ? m[1].toLowerCase() : null;
};

export const careersPath = (orgSlug: string) => `/careers/${orgSlug}`;
export const jobPath = (orgSlug: string, job: { id: string; title: string }) => `/careers/${orgSlug}/jobs/${jobSlug(job)}`;

/** Absolute job URL with optional tracking parameters. */
export function jobUrl(orgSlug: string, job: { id: string; title: string }, params?: Record<string, string>) {
  const url = new URL(SITE_URL + jobPath(orgSlug, job));
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return url.toString();
}

export interface EmbedOptions {
  layout?: "list" | "grid";
  /** #RRGGBB; omitted = follow the organization's brand colour. */
  color?: string | null;
  limit?: number | null;
  scheme?: "light" | "auto";
}

/** Script tag customers paste where the jobs list should appear. Only non-default options are written. */
export function embedSnippet(orgSlug: string, opts: EmbedOptions = {}) {
  const attrs = [`src="${SITE_URL}/embed.js"`, `data-org="${orgSlug}"`];
  if (opts.layout === "grid") attrs.push(`data-layout="grid"`);
  if (opts.color && /^#[0-9a-fA-F]{6}$/.test(opts.color)) attrs.push(`data-color="${opts.color.toUpperCase()}"`);
  if (opts.limit && opts.limit > 0) attrs.push(`data-limit="${Math.floor(opts.limit)}"`);
  if (opts.scheme === "auto") attrs.push(`data-scheme="auto"`);
  return `<script ${attrs.join(" ")}></script>`;
}

/** Browser-side fetch of a public careers listing (no Next cache). */
export async function fetchListing(orgSlug: string, channel?: "embed"): Promise<CareersListing> {
  const qs = channel ? `?channel=${channel}` : "";
  const res = await fetch(`${API_URL}/public/careers/${encodeURIComponent(orgSlug)}${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Careers listing failed (${res.status})`);
  return (await res.json()).data as CareersListing;
}

/** Server-side fetch of public careers data. Returns null on 404. */
export async function fetchPublic<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/public/careers${path}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Careers request failed (${res.status})`);
  const body = (await res.json()) as { data: T };
  return body.data;
}
