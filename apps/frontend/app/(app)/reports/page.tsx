"use client";

import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Download } from "lucide-react";
import { useState } from "react";
import { RecruitmentFunnel } from "@/components/reports/recruitment-funnel";
import { FUNNEL_BASE_COLORS } from "@/constants/reports.constants";
import { ReportsLineChart } from "@/features/reports/ReportsLineChart";
import { ExportReportDialog } from "@/features/reports/ExportReportDialog";
import { Role } from "@/constants/enums";
import { useReports } from "@/hooks/useReports";
import type { FunnelStage } from "@/lib/types";
import { Skeleton } from "@/components/skeletons";

export default function ReportsPage() {
  return (
    <Guard section="reports">
      <ReportsInner />
    </Guard>
  );
}

function ReportsInner() {
  const role = useAppStore((s) => s.role);
  const user = useAppStore((s) => s.user)();

  const { data, isLoading } = useReports();

  const isManager = role === Role.HIRING_MANAGER;
  const isAdmin = role === Role.ADMINISTRATOR;

  const today = new Date();
  const monthAgo = new Date(today.getTime() - 28 * 86_400_000);
  const rangeLabel = `${monthAgo.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${today.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const scopeLabel = isManager
    ? `${user.department ?? "Your department"} funnel`
    : "Overall organization funnel";

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = data
    ? [
      { l: "Applications", v: data.kpis.totalApplications.toLocaleString() },
      { l: "Interviews Scheduled", v: data.kpis.totalInterviews.toLocaleString() },
      { l: "Offer Acceptance", v: `${data.kpis.offerAcceptanceRate}%` },
      { l: "Avg. Time to Hire", v: `${data.kpis.avgTimeToHire}d` },
    ]
    : [];

  // ── Applications over time ──────────────────────────────────────────────────
  const weeks = data?.applicationsOverTime.map((w) => w.week) ?? [];
  const series = data?.applicationsOverTime.map((w) => w.count) ?? [];
  const seriesMax = Math.max(...series, 1);

  // ── Applications per department ─────────────────────────────────────────────
  const byDept = data?.applicationsPerDepartment ?? [];
  const deptMax = Math.max(...byDept.map((d) => d.count), 1);

  // ── Recruitment funnel ──────────────────────────────────────────────────────
  const funnelStages: FunnelStage[] = (data?.funnelStages ?? []).map(
    (s, i) => ({
      name: s.stage,
      value: s.value,
      conv: s.conv,
      color: FUNNEL_BASE_COLORS[i] ?? FUNNEL_BASE_COLORS[0],
    })
  );

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Workspace" }, { label: "Reports" }]}
        title="Reports"
        description={
          isManager
            ? `Hiring performance for ${user.department}`
            : "Track hiring performance across the organization."
        }
      />

      <div className="px-4 py-6 md:px-8 space-y-6">
        {/* ── KPI cards ─────────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <Skeleton.ReportsKpi count={4} />
          ) : (
            kpis.map((k) => (
              <div key={k.l} className="surface-card p-5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {k.l}
                </div>
                <div className="mt-2 font-display text-[26px] font-semibold tracking-tight">
                  {k.v}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Charts row ────────────────────────────────────────────────────── */}
        <div className={"grid gap-4 " + (isAdmin ? "lg:grid-cols-2" : "grid-cols-1")}>
          {/* Applications over time */}
          <div className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] font-semibold">Applications over time</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  Weekly applications — last 4 weeks
                </div>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                {isManager ? user.department : "All"}
              </span>
            </div>
            {isLoading ? (
              <div className="mt-4 h-56 animate-pulse rounded-lg bg-secondary" />
            ) : series.length > 1 ? (
              <ReportsLineChart weeks={weeks} series={series} max={seriesMax} />
            ) : (
              <div className="mt-4 flex h-56 items-center justify-center text-[12px] text-muted-foreground">
                No application data yet.
              </div>
            )}
          </div>

          {/* Applications per department — admin only */}
          {isAdmin && (
            <div className="surface-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-semibold">Applications per department</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Distribution across departments
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                  Admin
                </span>
              </div>

              {isLoading ? (
                <div className="mt-4 h-56 animate-pulse rounded-lg bg-secondary" />
              ) : byDept.length === 0 ? (
                <div className="mt-4 flex h-56 items-center justify-center text-[12px] text-muted-foreground">
                  No data yet.
                </div>
              ) : (
                <>
                  <div className="relative mt-6 flex h-56 items-end gap-2 border-b border-border sm:gap-3">
                    {byDept.map((d) => {
                      const pct = Math.max(2, (d.count / deptMax) * 100);
                      return (
                        <div
                          key={d.department}
                          className="relative flex flex-1 flex-col items-center justify-end"
                          style={{ height: "100%" }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              bottom: `calc(${pct}% + 4px)`,
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "var(--foreground)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {d.count}
                          </span>
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: `${pct}%`,
                              minHeight: "4px",
                              borderRadius: "4px 4px 0 0",
                              backgroundColor: "var(--color-chart-1)",
                              transition: "opacity 0.15s",
                            }}
                            title={`${d.department}: ${d.count}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2 sm:gap-3">
                    {byDept.map((d) => (
                      <div
                        key={d.department}
                        className="flex-1 truncate text-center text-[10px] leading-tight text-muted-foreground"
                        title={d.department}
                      >
                        {d.department}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Recruitment funnel ────────────────────────────────────────────── */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[13px] font-semibold">Recruitment Funnel</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {scopeLabel} — candidate conversion across hiring stages
              </div>
            </div>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {isManager ? user.department : "Org-wide"}
            </span>
          </div>

          {isLoading ? (
            <div className="h-[480px] animate-pulse rounded-lg bg-secondary" />
          ) : funnelStages.length === 0 || funnelStages.every((s) => s.value === 0) ? (
            <div className="flex h-48 items-center justify-center text-[12px] text-muted-foreground">
              No pipeline data yet.
            </div>
          ) : (
            <RecruitmentFunnel stages={funnelStages} />
          )}
        </div>
      </div>
    </div>
  );
}
