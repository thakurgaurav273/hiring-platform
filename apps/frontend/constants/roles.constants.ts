// Role Keys — use these constants for role-based logic instead of raw strings.
// This ensures changes to role labels won't break comparisons.

import { Role } from "./enums";

export const ROLE_KEYS = {
  ADMINISTRATOR: Role.ADMINISTRATOR,
  HIRING_MANAGER: Role.HIRING_MANAGER,
  RECRUITER: Role.RECRUITER,
  EMPLOYEE: Role.EMPLOYEE,
} as const;

export type Section =
  | "dashboard"
  | "jobs"
  | "candidates"
  | "pipeline"
  | "interviews"
  | "timeline"
  | "mail"
  | "reports"
  | "settings"
  | "users"
  | "referrals"
  | "applications"
  | "profile"
  | "notifications";

export const PERMISSIONS: Record<Role, Section[]> = {
  [ROLE_KEYS.ADMINISTRATOR]: [
    "dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail",
    "reports", "settings", "users", "referrals", "profile", "notifications",
  ],
  [ROLE_KEYS.HIRING_MANAGER]: [
    "dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail",
    "reports", "referrals", "settings", "profile", "notifications",
  ],
  [ROLE_KEYS.RECRUITER]: [
    "dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail",
    "referrals", "settings", "profile", "notifications",
  ],
  [ROLE_KEYS.EMPLOYEE]: [
    "dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail",
    "referrals", "settings", "profile", "notifications",
  ],
};

export const USERS: Record<Role, { name: string; email: string; department?: string }> = {
  [ROLE_KEYS.ADMINISTRATOR]: { name: "Priya Natarajan", email: "priya@grovyn.com" },
  [ROLE_KEYS.HIRING_MANAGER]: { name: "Marcus Chen", email: "marcus@grovyn.com", department: "Design" },
  [ROLE_KEYS.RECRUITER]: { name: "Daniel Okafor", email: "daniel@grovyn.com", department: "Engineering" },
  [ROLE_KEYS.EMPLOYEE]: { name: "Ava Laurent", email: "ava.laurent@gmail.com" },
};

export const NAV_ORDER_BY_ROLE: Record<Role, Section[]> = {
  [ROLE_KEYS.ADMINISTRATOR]: ["dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail", "referrals", "reports", "settings"],
  [ROLE_KEYS.HIRING_MANAGER]: ["dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "mail", "referrals", "reports", "settings"],
  [ROLE_KEYS.RECRUITER]: ["dashboard", "jobs", "candidates", "pipeline", "interviews", "timeline", "referrals", "mail", "settings"],
  [ROLE_KEYS.EMPLOYEE]: ["dashboard", "jobs", "candidates", "interviews", "timeline", "referrals", "mail", "settings"],
};

export const ALL_ROLES: Role[] = [
  ROLE_KEYS.ADMINISTRATOR,
  ROLE_KEYS.HIRING_MANAGER,
  ROLE_KEYS.RECRUITER,
  ROLE_KEYS.EMPLOYEE,
];
