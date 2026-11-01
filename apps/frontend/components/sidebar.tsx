"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { toast } from "sonner";
import { ALL_NAV, type NavItem } from "@/constants/navigation.constants";
import { NAV_ORDER_BY_ROLE, ROLE_KEYS } from "@/constants/roles.constants";
import { useJobs } from "@/hooks/useJobs";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { useTheme } from "@/components/theme-provider";
import { PoweredBy, WorkspaceMark } from "@/components/brand";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAppStore((s) => s.role);
  const can = useAppStore((s) => s.can);
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user)();
  const { brand } = useTheme();
  // Only employees' navigation depends on whether any jobs exist.
  const isEmployee = role === ROLE_KEYS.EMPLOYEE;
  const { data: jobsData } = useJobs({ limit: 1 }, { enabled: isEmployee });
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

  const handleLogout = () => {
    onNavigate?.();
    logout();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <WorkspaceMark size={28} />
        <div className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-display text-[14.5px] font-semibold tracking-tight">{brand.name}</span>
          <span className="mt-1 truncate text-[10.5px] text-sidebar-muted">{PLATFORM_BRANDING.productName}</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-muted">
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
                aria-current={active ? "page" : undefined}
                className={
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-active-foreground"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground")
                }
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-sidebar-primary" />}
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/70 p-3">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-sidebar-muted">Signed in as</div>
          <div className="mt-1 truncate text-[13px] font-semibold">{user.name}</div>
          <div className="text-[11.5px] text-sidebar-muted">{role}</div>
        </div>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0 text-sidebar-muted group-hover:text-destructive" />
          <span>Log out</span>
        </button>
        <div className="px-2.5 pt-1">
          <PoweredBy placement="sidebar" className="text-sidebar-muted hover:text-sidebar-foreground" />
        </div>
      </div>
    </div>
  );
}
