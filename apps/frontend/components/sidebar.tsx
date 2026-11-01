"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import { ALL_NAV, type NavItem } from "@/constants/navigation.constants";
import { NAV_ORDER_BY_ROLE, ROLE_KEYS } from "@/constants/roles.constants";
import { useJobs } from "@/hooks/useJobs";

export function GrovynMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/grovyn-logo-transparent.png"
      alt="Grovyn"
      width={size}
      height={size}
      className="shrink-0 select-none rounded-xl object-cover shadow-sm"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  const can = useAppStore((s) => s.can);
  const user = useAppStore((s) => s.user)();
  const { data: jobsData } = useJobs(role === ROLE_KEYS.EMPLOYEE ? { limit: 1 } : undefined);
  const hasJobs = role !== ROLE_KEYS.EMPLOYEE || (jobsData?.data?.jobs && jobsData.data.jobs.length > 0);

  const nav = NAV_ORDER_BY_ROLE[role]
    .map((s) => ALL_NAV.find((n) => n.section === s))
    .filter((n): n is NavItem => {
      if (!n || !can(n.section)) return false;
      if (role === ROLE_KEYS.EMPLOYEE && ["jobs", "candidates", "pipeline"].includes(n.section)) {
        return !!hasJobs;
      }
      return true;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <GrovynMark size={28} />
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-tight">Grovyn</span>
          <span className="mt-0.5 text-[10px] capitalize tracking-[0.14em] text-muted-foreground">Grovyn Talent</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Workspace
        </div>
        <div className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onNavigate}
                className={
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground")
                }
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-primary" />}
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="rounded-lg bg-secondary/60 p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">Signed in as</div>
          <div className="mt-1 text-[13px] font-semibold">{user.name}</div>
          <div className="text-[11.5px] text-muted-foreground">{role}</div>
        </div>
        <button
          onClick={() => {
            onNavigate?.();
            toast("Signed out");
            router.push("/login");
          }}
          className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-destructive" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
