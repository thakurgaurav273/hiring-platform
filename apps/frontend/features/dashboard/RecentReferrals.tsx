import Link from "next/link";
import { jobById } from "@/lib/mock-data";
import type { Candidate } from "@/lib/types";

interface RecentReferralsProps {
  referrals: Candidate[];
}

const STATUS_STYLES: Record<string, string> = {
  "Under Review": "bg-secondary text-foreground",
  "Interview": "bg-primary/10 text-primary",
  "Offer": "bg-primary/10 text-primary",
  "Rejected": "bg-destructive/10 text-destructive",
};

export function RecentReferrals({ referrals }: RecentReferralsProps) {
  return (
    <div className="surface-card lg:col-span-2">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-[13px] font-semibold">Recent referrals</div>
        <Link href="/referrals" className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {referrals.slice(0, 5).map((c) => {
          const j = jobById(c.jobId);
          return (
            <Link key={c.id} href={`/candidates/${c.id}`} className="block px-5 py-3 hover:bg-secondary/40">
              <div className="flex items-center gap-2">
                <div className="truncate text-[12.5px] font-medium">{c.name}</div>
                <span
                  className={
                    "ml-auto rounded-md px-1.5 py-0.5 text-[10.5px] font-medium " +
                    (STATUS_STYLES[c.stage] ?? "bg-secondary")
                  }
                >
                  {c.stage}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {j?.title} · Applied {c.appliedAt}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
