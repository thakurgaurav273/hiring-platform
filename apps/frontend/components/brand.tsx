"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { useTheme } from "@/components/theme-provider";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * An organization's logo, or a monogram on the primary colour when no logo
 * has been uploaded.
 */
export function OrgMark({
  name,
  logoUrl,
  size = 32,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tenant logos are remote, user-uploaded images
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        draggable={false}
        className={cn("shrink-0 select-none rounded-md object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-md bg-primary font-semibold text-primary-foreground",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) }}
    >
      {initialsOf(name)}
    </span>
  );
}

/** The active workspace's mark (organization when signed in, otherwise the product). */
export function WorkspaceMark({ size = 32, className }: { size?: number; className?: string }) {
  const { brand } = useTheme();
  return <OrgMark name={brand.name} logoUrl={brand.logoUrl} size={size} className={className} />;
}

/** Robin Labs platform mark. */
export function PlatformMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small static image
    <img
      src={PLATFORM_BRANDING.logoUrl}
      alt={PLATFORM_BRANDING.platformName}
      width={size}
      height={size}
      className={cn("shrink-0 select-none rounded-[22%] object-cover", className)}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/** Product lockup used where no organization context exists (e.g. sign-in). */
export function PlatformLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PlatformMark size={30} />
      <div className="leading-tight">
        <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
          {PLATFORM_BRANDING.productName}
        </div>
        <div className="text-[11.5px] text-muted-foreground">by {PLATFORM_BRANDING.platformName}</div>
      </div>
    </div>
  );
}

type Placement = "sidebar" | "auth" | "about";

/**
 * "Powered by Robin Labs". Visibility is controlled by platform configuration
 * (PLATFORM_BRANDING.attribution), never by organization branding.
 */
export function PoweredBy({ placement, className }: { placement: Placement; className?: string }) {
  const { attribution, platformUrl } = PLATFORM_BRANDING;
  const visible =
    placement === "sidebar" ? attribution.showInSidebar : placement === "auth" ? attribution.showOnAuth : attribution.showInAbout;
  if (!visible) return null;

  const content = (
    <>
      <PlatformMark size={14} className="opacity-80" />
      <span>{attribution.label}</span>
    </>
  );
  const classes = cn("inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground", className);

  return platformUrl ? (
    <a href={platformUrl} target="_blank" rel="noopener noreferrer" className={cn(classes, "hover:text-foreground")}>
      {content}
    </a>
  ) : (
    <span className={classes}>{content}</span>
  );
}
