"use client";

import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/skeletons";

export function ReportsKpis({
  kpis,
  rangeLabel,
  loading,
}: {
  kpis: readonly { readonly l: string; readonly v: string | number; readonly d: string }[];
  rangeLabel: string;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton.ReportsKpi count={4} />;
  }

  return (
    <>
      {kpis.map((s) => (
        <div key={s.l} className="surface-card p-5">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s.l}</div>
          <div className="mt-2 font-display text-[26px] font-semibold tracking-tight">{s.v}</div>
          <div className="mt-1 text-[10.5px] text-muted-foreground">{rangeLabel}</div>
          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[oklch(0.55_0.15_155)]">
              <TrendingUp className="h-3 w-3" /> {s.d}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
