import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface FunnelBar {
  stage: string;
  count: number;
}

interface HiringFunnelProps {
  bars: FunnelBar[];
}

// Short display labels for the chart x-axis so they fit cleanly
const SHORT_LABELS: Record<string, string> = {
  "Applied": "Applied",
  "Screening": "Screening",
  "Shortlisted": "Shortlisted",
  "Interview Scheduled": "Int. Sched.",
  "Interview Completed": "Int. Done",
  "Technical Interview": "Technical",
  "HR Round": "HR Round",
  "Offer Sent": "Offer Sent",
  "Hired": "Hired",
  "Rejected": "Rejected",
};

export function HiringFunnel({ bars }: HiringFunnelProps) {
  const maxFunnel = Math.max(...bars.map((f) => f.count), 1);

  return (
    <div className="mt-6 surface-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold">Hiring funnel</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            Candidate distribution across every stage
          </div>
        </div>
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          Open pipeline <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Chart area: fixed height so percentage bar heights resolve correctly */}
      <div className="relative mt-6 flex h-56 items-end gap-1.5 border-b border-border sm:gap-2">
        {bars.map((f) => {
          const pct = Math.max(2, (f.count / maxFunnel) * 100);
          const isRejected = f.stage === "Rejected";
          return (
            <div
              key={f.stage}
              className="relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Count label just above the bar */}
              <span
                style={{
                  position: "absolute",
                  bottom: `calc(${pct}% + 4px)`,
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "var(--foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                {f.count}
              </span>
              {/* Bar */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${pct}%`,
                  minHeight: "4px",
                  borderRadius: "4px 4px 0 0",
                  backgroundColor: isRejected ? "var(--color-destructive)" : "var(--color-chart-1)",
                  opacity: isRejected ? 0.8 : 1,
                  transition: "opacity 0.15s",
                }}
                title={`${f.stage}: ${f.count}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {bars.map((f) => (
          <div
            key={f.stage}
            className="flex-1 truncate text-center text-[9.5px] leading-tight text-muted-foreground"
            title={f.stage}
          >
            {SHORT_LABELS[f.stage] ?? f.stage}
          </div>
        ))}
      </div>
    </div>
  );
}
