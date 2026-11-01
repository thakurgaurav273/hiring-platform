// Settings page constants — mock data and configuration for the settings section.
// Team list moves to the backend once the User Management API is available.

import type { AppearanceMode } from "@/lib/theme/types";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import type { ElementType } from "react";

// ─── Team ─────────────────────────────────────────────────────────────────────

export type TeamMember = {
  name: string;
  email: string;
  role: string;
};

export const TEAM: TeamMember[] = [
  { name: "Priya Natarajan",  email: "priya@grovyn.com",      role: "Administrator"  },
  { name: "Marcus Chen",      email: "marcus@grovyn.com",      role: "Hiring Manager" },
  { name: "Daniel Okafor",    email: "daniel@grovyn.com",      role: "Recruiter"      },
  { name: "Sana Iqbal",       email: "sana@grovyn.com",        role: "Recruiter"      },
  { name: "Yuki Tanabe",      email: "yuki@grovyn.com",        role: "Hiring Manager" },
  { name: "Ava Laurent",      email: "ava.laurent@gmail.com",  role: "Employee"       },
];

// ─── Theme ────────────────────────────────────────────────────────────────────

export type ThemeOption = {
  v: AppearanceMode;
  l: string;
  d: string;
  i: ElementType;
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    v: "light",
    l: "Light",
    d: "Bright, clean interface for daylight use.",
    i: Sun,
  },
  {
    v: "dark",
    l: "Dark",
    d: "Comfortable low-light experience with reduced glare.",
    i: Moon,
  },
  {
    v: "system",
    l: "System",
    d: "Follows your operating system setting.",
    i: MonitorSmartphone,
  },
];
