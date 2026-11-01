import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/services/api/auth.service";
import {
  CANDIDATES,
  JOBS,
  EMAIL_THREADS,
  type Candidate,
  type Stage,
  type EmailThread,
  type Job,
} from "@/lib/mock-data";
import type { Application } from "@/lib/types";
import {
  PERMISSIONS,
  USERS,
  type Section,
  ROLE_KEYS,
} from "@/constants/roles.constants";

import { ApplicationStatus, JobStatus, Role } from "@/constants/enums";
import { canViewJobDetails, canViewAllJobs } from "@/lib/utils/permissions";

// Re-export for backward compat — existing files importing from app.store continue to work
export type { Role, Section, Application };
export type ThemeMode = "light" | "dark" | "system";

interface AppState {
  candidates: Candidate[];
  role: Role;
  threads: EmailThread[];
  theme: ThemeMode;
  applications: Application[];
  jobs: Job[];

  // Auth State
  accessToken: string | null;
  authUser: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  updateAuthUser: (patch: Partial<UserProfile>) => void;
  logout: () => void;

  // Candidate actions
  moveCandidate: (id: string, stage: Stage) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  addCandidate: (c: Omit<Candidate, "id">) => void;

  // Role + permissions
  setRole: (r: Role) => void;
  can: (s: Section) => boolean;
  user: () => { name: string; email: string; role: Role; department?: string; phone?: string; address?: string; title?: string; notificationPreferences?: Record<string, boolean> };
  visibleJobs: () => Job[];

  // Application actions
  applyToJob: (jobId: string) => void;

  // Mail actions
  toggleStar: (id: string) => void;
  archiveThread: (id: string) => void;

  // Theme
  setTheme: (t: ThemeMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      candidates: CANDIDATES,
  role: Role.ADMINISTRATOR,
  threads: EMAIL_THREADS,
  theme: "light",
  jobs: JOBS,
  applications: [
    { id: "app_1", jobId: "job_1", appliedAt: "3 days ago", status: ApplicationStatus.INTERVIEW },
    { id: "app_2", jobId: "job_3", appliedAt: "1 week ago", status: ApplicationStatus.UNDER_REVIEW },
    { id: "app_3", jobId: "job_6", appliedAt: "2 weeks ago", status: ApplicationStatus.REJECTED },
  ],

  // Auth state
  accessToken: null,
  authUser: null,
  isAuthenticated: false,
  setAuth: (user, token) => set({
    authUser: user,
    accessToken: token,
    isAuthenticated: true,
    role: user.role,
  }),
  updateAuthUser: (patch) => set((state) => ({
    authUser: state.authUser ? { ...state.authUser, ...patch } : null,
  })),
  logout: () => set({
    authUser: null,
    accessToken: null,
    isAuthenticated: false,
    role: Role.EMPLOYEE, // default back to employee
  }),

  // Candidate actions
  moveCandidate: (id, stage) =>
    set((s) => ({ candidates: s.candidates.map((c) => (c.id === id ? { ...c, stage } : c)) })),
  updateCandidate: (id, patch) =>
    set((s) => ({ candidates: s.candidates.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  addCandidate: (c) => set((s) => ({ candidates: [{ ...c, id: `cand_${Math.random().toString(36).substring(7)}` }, ...s.candidates] })),

  // Role + permissions
  setRole: (role) => set({ role }),
  can: (section) => PERMISSIONS[get().role].includes(section),
  user: () => {
    const auth = get().authUser;
    return {
      name: auth ? `${auth.firstName} ${auth.lastName}` : "System User",
      email: auth ? auth.email : "system@grovyn.com",
      role: auth ? auth.role : get().role,
      department: auth ? auth.department : "Engineering",
      title: auth?.title,
      phone: auth?.phone,
      address: auth?.address,
      notificationPreferences: auth?.notificationPreferences,
    };
  },

  visibleJobs: () => get().jobs,

  // Application actions
  applyToJob: (jobId) =>
    set((s) => ({
      applications: [
        { id: `app_${Math.random().toString(36).substring(7)}`, jobId, appliedAt: "Just now", status: ApplicationStatus.UNDER_REVIEW },
        ...s.applications,
      ],
    })),

  // Mail actions
  toggleStar: (id) =>
    set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)) })),
  archiveThread: (id) =>
    set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, archived: true } : t)) })),

  // Theme
  setTheme: (theme) => set({ theme }),
    }),
    {
      name: "grovyn-auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        authUser: state.authUser,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
