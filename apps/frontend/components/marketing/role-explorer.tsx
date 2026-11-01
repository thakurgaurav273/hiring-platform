"use client";

import { useId, useState } from "react";
import { ALL_NAV } from "@/constants/navigation.constants";
import { NAV_ORDER_BY_ROLE, ROLE_KEYS } from "@/constants/roles.constants";
import { cn } from "@/lib/utils";

// Navigation comes from the app's real role configuration, so this section
// cannot drift from what each role actually sees.
const ROLES = [
  {
    key: ROLE_KEYS.ADMINISTRATOR,
    label: "Administrator",
    line: "Owns the workspace.",
    does: ["Invites people and assigns roles", "Sets the organization's branding", "Sees every job, candidate and report"],
  },
  {
    key: ROLE_KEYS.RECRUITER,
    label: "Recruiter",
    line: "Runs hiring day to day.",
    does: ["Moves candidates through the pipeline", "Schedules interviews and panels", "Emails candidates from the workspace"],
  },
  {
    key: ROLE_KEYS.HIRING_MANAGER,
    label: "Hiring manager",
    line: "Makes the call.",
    does: ["Shapes the roles on their team", "Reviews feedback and recommendations", "Tracks their team's hiring reports"],
  },
  {
    key: ROLE_KEYS.EMPLOYEE,
    label: "Employee",
    line: "Helps the company grow.",
    does: ["Browses open roles", "Refers people they trust", "Joins interview panels when invited"],
  },
];

export function RoleExplorer() {
  const [active, setActive] = useState(0);
  const id = useId();
  const role = ROLES[active];
  const nav = NAV_ORDER_BY_ROLE[role.key].map((s) => ALL_NAV.find((n) => n.section === s)?.label).filter(Boolean);

  return (
    <div>
      <div role="tablist" aria-label="Roles" className="flex flex-wrap gap-x-8 gap-y-2 border-b border-border">
        {ROLES.map((r, i) => (
          <button
            key={r.key}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel`}
            onClick={() => setActive(i)}
            className={cn(
              "-mb-px border-b-2 pb-3 font-display text-[18px] font-semibold tracking-tight transition sm:text-[22px]",
              i === active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="grid gap-10 pt-10 md:grid-cols-[minmax(0,1fr)_260px]"
      >
        <div>
          <p className="font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">{role.line}</p>
          <ul className="mt-6 space-y-3">
            {role.does.map((d) => (
              <li key={d} className="flex items-baseline gap-3 text-[16px]">
                <span className="h-px w-5 shrink-0 translate-y-[-4px] bg-primary" aria-hidden="true" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Their sidebar</div>
          <ol className="space-y-0.5">
            {nav.map((label, i) => (
              <li
                key={label}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px]",
                  i === 0 ? "bg-secondary font-medium text-primary" : "text-foreground/80"
                )}
              >
                {label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
