"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export function ExportReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { start: "", end: "" }
  });

  useEffect(() => {
    if (open) {
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 86400_000);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      reset({ start: iso(monthAgo), end: iso(today) });
    }
  }, [open, reset]);

  const start = watch("start");
  const end = watch("end");

  const rangeLabel = start && end 
    ? `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : "Select date range";

  const onSubmit = () => {
    toast.success(`Report downloaded for ${rangeLabel}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Export report</DialogTitle>
            <DialogDescription>Choose the reporting window. A CSV will be prepared for download.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2 mt-4 mb-4">
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">Start date</span>
              <input type="date" {...register("start")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">End date</span>
              <input type="date" {...register("end")} className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-[13px] outline-none focus:border-ring" />
            </label>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-surface-2 p-3 text-[11.5px] text-muted-foreground mb-4">
            Range: <span className="font-medium text-foreground">{rangeLabel}</span>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border border-border bg-surface px-3 text-[13px] font-medium hover:bg-secondary">Cancel</button>
            <button
              type="submit"
              className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" /> Download Report
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
