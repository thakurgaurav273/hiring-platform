// Navigation constants — centralized nav item definitions

import type { Section } from "@/constants/roles.constants";

export type NavItem = { to: string; label: string; section: Section; badge?: string };

export const ALL_NAV: NavItem[] = [
  { to: "/dashboard",    label: "Dashboard",       section: "dashboard" },
  { to: "/referrals",    label: "Referrals",        section: "referrals" },
  { to: "/applications", label: "My Applications",  section: "applications" },
  { to: "/jobs",         label: "Jobs",             section: "jobs",       badge: "8" },
  { to: "/candidates",   label: "Candidates",       section: "candidates", badge: "48" },
  { to: "/pipeline",     label: "Hiring Pipeline",  section: "pipeline" },
  { to: "/interviews",   label: "Interviews",       section: "interviews" },
  { to: "/timeline",     label: "Timeline",         section: "timeline" },
  { to: "/mail",         label: "Mail",             section: "mail",       badge: "4" },
  { to: "/reports",      label: "Reports",          section: "reports" },
  { to: "/profile",      label: "Profile",          section: "profile" },
  { to: "/settings",     label: "Settings",         section: "settings" },
];

// Mail folder definitions
export const MAIL_FOLDERS = [
  { key: "inbox",   label: "Inbox" },
  { key: "starred", label: "Starred" },
  { key: "sent",    label: "Sent" },
  { key: "drafts",  label: "Drafts" },
  { key: "archive", label: "Archive" },
] as const;

export type MailFolder = (typeof MAIL_FOLDERS)[number]["key"];
