"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { Skeleton } from "@/components/skeletons";
import { Role } from "@/constants/enums";
import { useEffect, useState } from "react";
import { Briefcase, UserPlus } from "lucide-react";
import { HiringFunnel } from "@/features/dashboard/HiringFunnel";
import { RecentApplications } from "@/features/dashboard/RecentApplications";
import { UpcomingInterviews } from "@/features/dashboard/UpcomingInterviews";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { RecentEmails } from "@/features/dashboard/RecentEmails";
import { useDashboardOverview } from "@/hooks/useDashboard";

export default function DashboardPage() {
  return (
    <Guard section="dashboard">
      <DashboardInner />
    </Guard>
  );
}

function DashboardInner() {
  const role = useAppStore((s) => s.role);
  if (role === Role.EMPLOYEE || role === Role.RECRUITER) return <ReferralDashboard />;
  return <ManagerDashboard />;
}

// ─── Manager / Admin / Hiring Manager ────────────────────────────────────────

function ManagerDashboard() {
  const role = useAppStore((s) => s.role);
  const user = useAppStore((s) => s.user)();
  const router = useRouter();
  const [ui, setUi] = useState({ greeting: "Good morning" });

  const { data: dashboardData, isLoading } = useDashboardOverview();

  useEffect(() => {
    const hour = new Date().getHours();
    let nextGreeting = "Good morning";
    if (hour >= 5 && hour < 12) nextGreeting = "Good morning";
    else if (hour >= 12 && hour < 17) nextGreeting = "Good afternoon";
    else nextGreeting = "Good evening";
    setUi({ greeting: nextGreeting });
  }, []);

  return (
    <div>
      <PageHeader
        title={<>{ui.greeting}, <span className="text-muted-foreground">{user.name.split(" ")[0]}</span></>}
        description="Here's a snapshot of what's on your radar."
        actions={
          [Role.ADMINISTRATOR, Role.HIRING_MANAGER].includes(role) && (
            <button
              onClick={() => router.push("/jobs")}
              className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-[color:var(--color-primary-hover)]"
            >
              <Briefcase className="h-3.5 w-3.5" /> New job
            </button>
          )
        }
      />

      <div className="px-4 py-6 md:px-8">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading && <Skeleton.KpiCard count={8} />}
          {!isLoading && dashboardData?.kpis?.map((s: any) => (
            <Link key={s.label} href={s.to || "#"} className="group surface-card flex flex-col p-4 transition hover:border-border-strong hover:shadow-sm">
              <div className="font-display text-[32px] font-semibold leading-none tracking-tight">{s.value}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-[12px] text-muted-foreground">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && <HiringFunnel bars={dashboardData?.funnelBars || []} />}

        {/* Recent Applications + Upcoming Interviews */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <RecentApplications applications={dashboardData?.recentApplications || []} />
          <UpcomingInterviews interviews={dashboardData?.upcomingInterviews || []} />
        </div>

        {/* Activity + Emails */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <RecentActivity events={dashboardData?.recentEvents || []} linkTo="/timeline" linkLabel="Full timeline" dotColor="bg-accent" />
          <RecentEmails variant="manager" emails={dashboardData?.recentEmails || []} />
        </div>
      </div>
    </div>
  );
}

// ─── Employee / Recruiter ─────────────────────────────────────────────────────

function ReferralDashboard() {
  const user = useAppStore((s) => s.user)();
  const router = useRouter();
  const [ui, setUi] = useState({ greeting: "Good morning" });

  const { data: dashboardData, isLoading } = useDashboardOverview();

  useEffect(() => {
    const hour = new Date().getHours();
    let nextGreeting = "Good morning";
    if (hour >= 5 && hour < 12) nextGreeting = "Good morning";
    else if (hour >= 12 && hour < 17) nextGreeting = "Good afternoon";
    else nextGreeting = "Good evening";
    setUi({ greeting: nextGreeting });
  }, []);

  return (
    <div>
      <PageHeader
        title={<>{ui.greeting}, <span className="text-muted-foreground">{user.name.split(" ")[0]}</span></>}
        description="Track the status of candidates you've referred to the team."
        actions={
          <button
            onClick={() => router.push("/referrals/new")}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-[color:var(--color-primary-hover)]"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add referral
          </button>
        }
      />

      <div className="px-4 py-6 md:px-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {isLoading && <Skeleton.KpiCard count={5} />}
          {!isLoading && dashboardData?.kpis?.map((s: any) => (
            <div key={s.label} className="surface-card p-4">
              <div className="mt-3 font-display text-[26px] font-semibold leading-none tracking-tight">{s.value}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Referrals + Upcoming Interviews */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <RecentApplications applications={dashboardData?.recentApplications || []} />
          <UpcomingInterviews interviews={dashboardData?.upcomingInterviews || []} />
        </div>

        {/* Recent Activity + Recent Mail */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <RecentActivity events={dashboardData?.recentEvents || []} linkTo="/timeline" linkLabel="Timeline" dotColor="bg-primary" />
          <RecentEmails variant="employee" emails={dashboardData?.recentEmails || []} />
        </div>
      </div>
    </div>
  );
}
