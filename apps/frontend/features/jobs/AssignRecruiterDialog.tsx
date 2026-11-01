"use client";

import { useState, useMemo } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEligibleTeamMembers, useInviteToHiringTeam } from "@/hooks/useJobs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const assignSchema = z.object({
  selected: z.string().min(1, "Please select a recruiter"),
});

export function AssignRecruiterDialog({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const [ui, setUi] = useState({ q: "", sent: false });

  const { data: membersRes, isLoading } = useEligibleTeamMembers(open ? jobId : "");
  const { mutateAsync: inviteToTeam, isPending } = useInviteToHiringTeam();

  const members = membersRes?.data || [];

  const { control, handleSubmit, reset, watch, setValue } = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { selected: "" },
  });

  const selectedVal = watch("selected");

  const list = useMemo(() => {
    return members.filter(
      (r: any) =>
        !ui.q ||
        r.firstName.toLowerCase().includes(ui.q.toLowerCase()) ||
        r.lastName.toLowerCase().includes(ui.q.toLowerCase()) ||
        r.email.toLowerCase().includes(ui.q.toLowerCase()) ||
        (r.department && r.department.toLowerCase().includes(ui.q.toLowerCase()))
    );
  }, [members, ui.q]);

  const handleClose = () => {
    setUi({ q: "", sent: false });
    reset();
    onClose();
  };

  const onSubmit = async (data: z.infer<typeof assignSchema>) => {
    try {
      await inviteToTeam({ id: jobId, userId: data.selected });
      setUi((prev) => ({ ...prev, sent: true }));
      toast.success("Invitation sent");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send invitation");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a recruiter</DialogTitle>
          <DialogDescription>
            Choose a recruiter to invite. They&apos;ll receive an email invitation.
          </DialogDescription>
        </DialogHeader>

        {ui.sent ? (
          <div className="rounded-lg border border-border bg-surface-2 p-6 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="mt-3 text-[14px] font-medium">Invitation Sent</div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              The recruiter will receive an invitation via email.
            </div>
          </div>
        ) : (
          <form id="assign-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={ui.q}
                onChange={(e) => setUi((p) => ({ ...p, q: e.target.value }))}
                placeholder="Search recruiters by name, email, or department"
                className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-ring"
              />
            </div>
            <div className="mt-3 max-h-[300px] divide-y divide-border overflow-y-auto rounded-lg border border-border">
              <Controller
                control={control}
                name="selected"
                render={({ field }) => (
                  <>
                    {list.map((r: any) => {
                      const isSel = field.value === r.id;
                      const name = `${r.firstName} ${r.lastName}`;
                      const roleDisplay = r.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => field.onChange(r.id)}
                          className={
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition " +
                            (isSel ? "bg-primary/8" : "hover:bg-secondary/60")
                          }
                        >
                          <Avatar name={name} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium">{name}</div>
                            <div className="truncate text-[11.5px] text-muted-foreground">
                              {r.email} · {r.department || "No department"} · {roleDisplay}
                            </div>
                          </div>
                          {isSel && <span className="text-[11px] font-medium text-primary">Selected</span>}
                        </button>
                      );
                    })}
                  </>
                )}
              />
              {isLoading ? (
                <div className="flex justify-center p-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <div className="p-6 text-center text-[12.5px] text-muted-foreground">
                  No eligible team members found.
                </div>
              ) : null}
            </div>
          </form>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={handleClose}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] font-medium hover:bg-secondary"
          >
            {ui.sent ? "Close" : "Cancel"}
          </button>
          {!ui.sent && (
            <button
              type="submit"
              form="assign-form"
              disabled={!selectedVal || isPending}
              className="h-9 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send invitation"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
