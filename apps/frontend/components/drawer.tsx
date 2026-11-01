"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Shared side drawer: header, scrollable body and a footer pinned to the
 * bottom. Built on the shadcn Sheet (Radix Dialog), so focus is trapped,
 * Escape and overlay clicks close it, and focus returns to the trigger.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  side = "right",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  side?: "right" | "left";
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("w-full gap-0 p-0 sm:max-w-[420px]", className)}>
        <SheetHeader className="border-b border-border px-6 py-5 pr-12">
          <SheetTitle className="text-[16px] tracking-tight">{title}</SheetTitle>
          {/* Radix requires a description for screen readers; keep it visually hidden if none is given. */}
          <SheetDescription className={description ? "text-[13px]" : "sr-only"}>
            {description ?? title}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <SheetFooter className="mt-0 flex-row items-center gap-2 border-t border-border bg-surface px-6 py-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
