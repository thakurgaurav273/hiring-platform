"use client";

import Link from "next/link";
import { forwardRef, type CSSProperties, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { OrgMark, PlatformLockup, PoweredBy } from "@/components/brand";

/**
 * Layout for every unauthenticated screen.
 *
 * Without `organization`, it shows platform (Robin Labs product) branding.
 * Pass `organization` only when the organization is known reliably, for
 * example from a server-validated invitation token. `themeStyle` scopes that
 * organization's theme to this page without touching the global theme.
 */
export function AuthShell({
  children,
  organization,
  themeStyle,
}: {
  children: ReactNode;
  organization?: { name: string; logoUrl: string | null } | null;
  themeStyle?: CSSProperties;
}) {
  return (
    <div style={themeStyle} className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center px-6 sm:px-10">
        <Link href={organization ? "/login" : "/"} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          {organization ? (
            <span className="flex items-center gap-2.5">
              <OrgMark name={organization.name} logoUrl={organization.logoUrl} size={30} />
              <span className="font-display text-[15px] font-semibold tracking-tight">{organization.name}</span>
            </span>
          ) : (
            <PlatformLockup />
          )}
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[420px] rounded-[var(--radius-card)] border border-border bg-surface p-7 shadow-sm sm:p-9">
          {children}
        </div>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 px-6 py-6 text-[12px] text-muted-foreground sm:flex-row sm:px-10">
        <span>
          © {new Date().getFullYear()} {PLATFORM_BRANDING.productName}
        </span>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
        </nav>
        <PoweredBy placement="auth" />
      </footer>
    </div>
  );
}

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon?: LucideIcon;
  error?: string;
  trailing?: ReactNode;
  labelAction?: ReactNode;
};

/** Labelled input with icon, inline error and accessible error wiring. */
export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { id, label, icon: Icon, error, trailing, labelAction, className, ...props },
  ref
) {
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="block text-[13px] font-medium text-foreground">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 w-full rounded-[var(--radius-control)] border bg-surface text-[14px] text-foreground outline-none transition",
            "placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/15",
            "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted-foreground",
            Icon ? "pl-10" : "pl-3.5",
            trailing ? "pr-11" : "pr-3.5",
            error ? "border-destructive focus:border-destructive focus:ring-destructive/15" : "border-border",
            className
          )}
          {...props}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[12px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});

export function AuthButton({
  children,
  loading,
  loadingText,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "outline";
}) {
  return (
    <button
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-[14px] font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70",
        variant === "primary"
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover"
          : "border border-border bg-surface text-foreground hover:bg-secondary",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[13px] text-destructive"
    >
      <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Centered result state (success or error) with an icon, title and message. */
export function AuthStatus({
  tone,
  title,
  children,
  action,
}: {
  tone: "success" | "error";
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div className="py-2 text-center" role={tone === "error" ? "alert" : "status"}>
      <div
        className={cn(
          "mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full",
          tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="font-display text-[22px] font-semibold tracking-tight">{title}</h1>
      <div className="mx-auto mt-2.5 max-w-[320px] text-[14px] leading-relaxed text-muted-foreground">{children}</div>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function AuthLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10" role="status">
      <LoaderCircle className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-[13px] text-muted-foreground">{label}</p>
    </div>
  );
}
