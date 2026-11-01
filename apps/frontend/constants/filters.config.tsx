/**
 * Filter definitions for every list in the app. Pages render them with
 * <Filters config={...} data={...} /> from "@/components/filters".
 *
 * Each field declares its type ("multi" checkboxes or "single" radio), who can
 * see it, and where its options come from. Option builders receive the page's
 * data plus the values of the fields above them, so a list can narrow as the
 * user picks (e.g. jobs within the selected departments).
 */
import { StageBadge } from "@/components/stage-badge";
import { STAGES } from "@/constants/stages.constants";
import { JobStatus, Role } from "@/constants/enums";
import { getJobStatusLabel } from "@/lib/utils/formatters";
import type { FilterConfig, FilterOption } from "@/components/filters/types";

// ─── Shared option builders ─────────────────────────────────────────────────

type JobLike = { id: string; title: string; department: string };

const toOptions = (values: string[]): FilterOption[] =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));

const stageLabel = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bHr\b/, "HR");

const STAGE_OPTIONS: FilterOption[] = STAGES.map((s) => ({ value: s, label: stageLabel(s), render: <StageBadge stage={s} /> }));

const jobsInDepartments = (jobs: JobLike[], departments: string[] | undefined) =>
  (departments?.length ? jobs.filter((j) => departments.includes(j.department)) : jobs).map((j) => ({
    value: j.id,
    label: j.title,
  }));

// ─── Candidates ─────────────────────────────────────────────────────────────

export interface CandidateFilterData {
  jobs: JobLike[];
}

export const CANDIDATE_FILTERS: FilterConfig<CandidateFilterData> = {
  title: "Filter candidates",
  description: "Narrow the list by department, stage or job.",
  fields: [
    {
      id: "department",
      label: "Department",
      type: "multi",
      roles: [Role.ADMINISTRATOR],
      options: ({ data }) => toOptions(data.jobs.map((j) => j.department)),
      emptyText: "No departments yet.",
    },
    { id: "stage", label: "Stage", type: "multi", options: STAGE_OPTIONS },
    {
      id: "job",
      label: "Job",
      type: "multi",
      searchable: true,
      options: ({ data, values }) => jobsInDepartments(data.jobs, values.department),
      emptyText: "No jobs to show yet.",
    },
  ],
};

// ─── Hiring pipeline ────────────────────────────────────────────────────────

export interface PipelineFilterData {
  jobs: JobLike[];
}

export const PIPELINE_FILTERS: FilterConfig<PipelineFilterData> = {
  title: "Filter pipeline",
  description: "The board shows one job at a time. Pick the job and the stages to show.",
  fields: [
    {
      id: "department",
      label: "Department",
      type: "single",
      allLabel: "All departments",
      roles: [Role.ADMINISTRATOR],
      options: ({ data }) => toOptions(data.jobs.map((j) => j.department)),
      emptyText: "No departments yet.",
    },
    {
      id: "job",
      label: "Job opening",
      type: "single",
      required: true,
      searchable: true,
      options: ({ data, values }) => jobsInDepartments(data.jobs, values.department),
      emptyText: "No job openings to show yet.",
    },
    { id: "stage", label: "Stage", type: "multi", options: STAGE_OPTIONS },
  ],
};

// ─── Jobs ───────────────────────────────────────────────────────────────────

export interface JobFilterData {
  departments: string[];
}

export const JOB_FILTERS: FilterConfig<JobFilterData> = {
  title: "Filter jobs",
  fields: [
    {
      id: "status",
      label: "Status",
      type: "single",
      allLabel: "All statuses",
      options: [JobStatus.OPEN, JobStatus.DRAFT, JobStatus.ON_HOLD, JobStatus.CLOSED].map((s) => ({
        value: s,
        label: getJobStatusLabel(s),
      })),
    },
    {
      id: "department",
      label: "Department",
      type: "single",
      allLabel: "All departments",
      roles: [Role.ADMINISTRATOR],
      options: ({ data }) => toOptions(data.departments),
      emptyText: "No departments yet.",
    },
  ],
};

// ─── Referrals (open roles) ─────────────────────────────────────────────────

export interface ReferralJobFilterData {
  departments: string[];
  locations: string[];
}

export const REFERRAL_JOB_FILTERS: FilterConfig<ReferralJobFilterData> = {
  title: "Filter open roles",
  fields: [
    {
      id: "department",
      label: "Department",
      type: "multi",
      options: ({ data }) => toOptions(data.departments),
      emptyText: "No departments yet.",
    },
    {
      id: "location",
      label: "Location",
      type: "multi",
      options: ({ data }) => toOptions(data.locations),
      emptyText: "No locations yet.",
    },
  ],
};
