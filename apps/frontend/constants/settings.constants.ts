// Settings page constants — mock data and configuration for the settings section.
// Team list moves to the backend once the User Management API is available.

import type { ThemeMode } from "@/store/app.store";
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
  v: ThemeMode;
  l: string;
  d: string;
  i: ElementType;
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    v: "light",
    l: "Light Mode",
    d: "Bright, clean interface for daylight use. Default.",
    i: Sun,
  },
  {
    v: "dark",
    l: "Dark Mode",
    d: "Comfortable low-light experience with reduced glare.",
    i: Moon,
  },
  {
    v: "system",
    l: "System Default",
    d: "Automatically follows your operating system preferences.",
    i: MonitorSmartphone,
  },
];
