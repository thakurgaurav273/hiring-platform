import type { SourceStats } from "@/services/api/reports.service";

/**
 * Applications by source, with how many reached an interview and how many
 * were hired. Cost metrics are left out on purpose: no spend data is
 * recorded, so cost per application would be made up.
 */
export function ApplicationsBySource({ rows, loading, scope }: { rows: SourceStats[]; loading: boolean; scope: string }) {
  const total = rows.reduce((n, r) => n + r.applications, 0);
  const max = Math.max(...rows.map((r) => r.applications), 1);

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold">Applications by source</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            Where applicants came from, and how many reached an interview or were hired
          </div>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">{scope}</span>
      </div>

      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-lg bg-secondary" />
      ) : rows.length === 0 ? (
        <div className="mt-4 flex h-32 items-center justify-center text-[12px] text-muted-foreground">No applications yet.</div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Source</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Applications</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Share</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Interviewed</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Source → interview</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">Hired</th>
                <th scope="col" className="py-2 text-right font-medium">Source → hire</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.sourceType} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                    <div>{r.label}</div>
                    <div className="mt-1 h-1.5 w-full max-w-[160px] rounded-full bg-secondary" aria-hidden>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(3, (r.applications / max) * 100)}%`, backgroundColor: "var(--color-chart-1)" }}
                      />
                    </div>
                  </th>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.applications.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">
                    {total ? Math.round((r.applications / total) * 100) : 0}%
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.interviewed.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.interviewRate}%</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.hired.toLocaleString()}</td>
                  <td className="py-2.5 text-right tabular-nums">{r.hireRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Cost per application isn&apos;t shown because no campaign spend is recorded.
          </p>
        </div>
      )}
    </div>
  );
}
