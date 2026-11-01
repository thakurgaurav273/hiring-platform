"use client";

/**
 * Shared building blocks for the Settings pages. Each settings section lives
 * in features/settings/sections; Branding and Careers have their own folders.
 */
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Card with a titled header, a body and an optional footer. */
export function SettingsCard({
  title,
  description,
  action,
  footer,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const id = `card-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section className={cn("surface-card overflow-hidden", className)} aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h3 id={id} className="text-[14px] font-semibold tracking-tight">
            {title}
          </h3>
          {description && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("px-5 pb-5 pt-5 sm:px-6 sm:pb-6", bodyClassName)}>{children}</div>
      {footer && <div className="border-t border-border bg-surface-2/50 px-5 py-3 sm:px-6">{footer}</div>}
    </section>
  );
}

/** Title block at the top of a settings section. */
export function SectionHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Label + control + optional hint/error, wired up for screen readers. */
export function SettingsField({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1.5 text-[12.5px] font-medium">
        {label}
        {optional && <span className="text-[11.5px] font-normal text-muted-foreground">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="mt-1.5 text-[11.5px] text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="mt-1.5 text-[11.5px] text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Footer for forms: save status on the left, Discard and Save on the right. */
export function FormFooter({
  dirty,
  saving,
  onDiscard,
  saveLabel = "Save changes",
  savedLabel = "All changes saved",
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard?: () => void;
  saveLabel?: string;
  savedLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto text-[12px] text-muted-foreground" aria-live="polite">
        {saving ? "Saving…" : dirty ? "Unsaved changes" : savedLabel}
      </span>
      {onDiscard && (
        <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={!dirty || saving}>
          Discard
        </Button>
      )}
      <Button type="submit" size="sm" disabled={!dirty || saving || disabled}>
        {saving && <Loader2 className="animate-spin" />} {saveLabel}
      </Button>
    </div>
  );
}

/** Warns before leaving the page with unsaved edits. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

export const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrator",
  hiring_manager: "Hiring manager",
  recruiter: "Recruiter",
  employee: "Employee",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  administrator: "Full access, including members, branding and all settings.",
  hiring_manager: "Runs hiring for their department, with access to reports.",
  recruiter: "Manages jobs, candidates, the pipeline and interviews.",
  employee: "Refers candidates and joins interview panels.",
};
