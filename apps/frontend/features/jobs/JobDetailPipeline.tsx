"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/app-shell";
import { StageBadge } from "@/components/stage-badge";
import { STAGES, canMoveStage } from "@/lib/mock-data";
import { toast } from "sonner";
import { ROLE_KEYS } from "@/constants/roles.constants";
import type { Candidate, Stage } from "@/lib/types";

import { useUpdateCandidateStage } from "@/hooks/useCandidates";

export function JobDetailPipeline({
  cands,
  role,
}: {
  cands: Candidate[];
  role: string;
}) {
  const { mutateAsync: updateStage } = useUpdateCandidateStage();
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 pb-2">
        {STAGES.map((s) => {
          const inStage = cands.filter((c) => c.stage === s);
          return (
            <div
              key={s}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(s);
              }}
              onDragLeave={() => setDragOver((d) => (d === s ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                if (role === ROLE_KEYS.EMPLOYEE) {
                  setDragOver(null);
                  return toast.error("Employees cannot move candidates");
                }
                const id = e.dataTransfer.getData("text/plain");
                if (id) {
                  const c = cands.find((cand) => cand.id === id);
                  if (c) {
                    if (!canMoveStage(c.stage, s)) {
                      toast.error("Backwards movement not allowed");
                    } else {
                      updateStage({ id, stage: s })
                        .then(() => toast.success(`Moved to ${s}`))
                        .catch((e: any) => toast.error(e.response?.data?.message || "Failed to update stage"));
                    }
                  }
                }
                setDragOver(null);
              }}
              className={
                "flex w-[260px] shrink-0 flex-col rounded-xl border transition " +
                (dragOver === s ? "border-accent bg-accent/5" : "border-border bg-surface-2")
              }
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <StageBadge stage={s} />
                <span className="text-[11px] text-muted-foreground tabular-nums">{inStage.length}</span>
              </div>
              <div className="space-y-2 p-2 min-h-[120px]">
                {inStage.map((c) => (
                  <Link
                    key={c.id}
                    href={`/candidates/${c.id}`}
                    draggable={role !== ROLE_KEYS.EMPLOYEE}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                    className="block rounded-lg border border-border bg-surface p-2.5 shadow-xs transition hover:border-border-strong hover:shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} seed={c.avatarSeed} size={24} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">{c.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {inStage.length === 0 && (
                  <div className="grid h-20 place-items-center rounded-lg border border-dashed border-border text-[11px] text-muted-foreground">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
