"use client";

import { Avatar } from "@/components/app-shell";
import { StageBadge } from "@/components/stage-badge";
import { useRouter } from "next/navigation";
import type { Candidate } from "@/lib/types";

export function JobDetailApplications({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Candidate</th>
              <th className="px-4 py-3 text-left font-medium">Stage</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Referred By</th>
              <th className="px-4 py-3 text-left font-medium">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/candidates/${c.id}`)}
                className="cursor-pointer hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} seed={c.avatarSeed} size={28} />
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={c.stage} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.location}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.referredBy || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">
                  {new Date(c.appliedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
