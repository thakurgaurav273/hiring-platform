"use client";

import Link from "next/link";
import { Avatar } from "@/components/app-shell";
import { StageBadge } from "@/components/stage-badge";
import { jobById, canMoveStage } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ROLE_KEYS } from "@/constants/roles.constants";
import type { Candidate, Stage } from "@/lib/types";
import { Role } from "@/constants/enums";

interface PipelineColumnProps {
  stage: Stage;
  cards: Candidate[];
  isDragOver: boolean;
  role: Role;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (id: string, targetStage: Stage) => void;
}

export function PipelineColumn({
  stage,
  cards,
  isDragOver,
  role,
  onDragOver,
  onDragLeave,
  onDrop,
}: PipelineColumnProps) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        if (role === Role.EMPLOYEE) {
          return toast.error("Employees cannot move candidates");
        }
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop(id, stage);
      }}
      className={
        "flex h-full w-[280px] shrink-0 flex-col rounded-xl border transition " +
        (isDragOver ? "border-accent bg-accent/5" : "border-border bg-surface-2")
      }
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StageBadge stage={stage} />
          <span className="text-[11px] text-muted-foreground tabular-nums">{cards.length}</span>
        </div>
        <button
          onClick={() => toast("Add candidate to " + stage)}
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {cards.map((c) => {
          const j = jobById(c.jobId);
          return (
            <Link
              key={c.id}
              href={`/candidates/${c.id}`}
              draggable={role !== Role.EMPLOYEE}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
              className="block rounded-lg border border-border bg-surface p-3 shadow-xs transition hover:border-border-strong hover:shadow-sm active:cursor-grabbing"
            >
              <div className="flex items-start gap-2">
                <Avatar name={c.name} seed={c.avatarSeed} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{c.name}</div>
                  <div className="truncate text-[10.5px] text-muted-foreground">{j?.title}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10.5px] text-muted-foreground">
                <span className="truncate">{c.recruiter}</span>
                <span>{c.lastActivity}</span>
              </div>
            </Link>
          );
        })}
        {cards.length === 0 && (
          <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border text-[11.5px] text-muted-foreground">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
