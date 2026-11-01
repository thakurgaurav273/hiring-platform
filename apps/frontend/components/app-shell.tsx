"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { initials, avatarGradient } from "@/lib/mock-data";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

import { SidebarContent } from "./sidebar";
import { WorkspaceMark } from "./brand";
import { useTheme } from "./theme-provider";
import { useWorkspaceSync } from "@/hooks/useWorkspace";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import { UserMenuButton, UserMenuContent, NotificationsMenu, ThemeToggle } from "./top-bar";
import { useAppStore } from "@/store/app.store";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { brand } = useTheme();
  // Refresh organization branding and personal preferences from the server
  useWorkspaceSync();
  // Inside the signed-in app the tab shows the workspace name. Public pages
  // (careers, website) keep the title from their own metadata.
  useEffect(() => {
    document.title = `${brand.name} · ${PLATFORM_BRANDING.productName}`;
  }, [brand.name]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Initialize FCM once per session when the user is logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    import("@/lib/firebase").then(({ requestFcmPermission }) => {
      requestFcmPermission((payload) => {
        // Foreground notification — show as toast
        const title = payload?.notification?.title ?? "New notification";
        const body = payload?.notification?.body ?? "";
        toast(title, { description: body });
      });
    }).catch(console.error);
  }, [isAuthenticated]);



  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop sidebar (permanent, large screens only) */}
      <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Drawer for mobile + tablet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-in-up absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <WorkspaceMark size={24} />
            <span className="max-w-[160px] truncate font-display text-[14px] font-semibold tracking-tight">{brand.name}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
            <span className="max-w-[200px] truncate">{brand.name}</span>
            <span aria-hidden="true">/</span>
            <span className="text-foreground capitalize">{(pathname.split('/')[1] || "dashboard").replace(/-/g, " ")}</span>
          </div>

          <div className="flex-1" />

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationsMenu />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UserMenuButton />
              </DropdownMenuTrigger>
              <UserMenuContent router={router} />
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main key={pathname} className="flex-1 overflow-y-auto animate-in-fade">{children}</main>
      </div>
    </div>
  );
}

export function Avatar({ name, seed, size = 32, url }: { name: string; seed?: string; size?: number; url?: string | null }) {
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
      style={{ width: size, height: size, background: avatarGradient(seed ?? name), fontSize: Math.max(10, size * 0.36) }}
    >
      {initials(name)}
    </div>
  );
}

// Reusable page header for content pages
export function PageHeader({ title, description, actions, breadcrumbs: _breadcrumbs, backButton, tabs }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; breadcrumbs?: { label: string; to?: string }[]; backButton?: ReactNode; tabs?: ReactNode }) {
  return (
    <div className={`border-b border-border bg-background px-4 pt-5 md:px-8 ${tabs ? "pb-0" : "pb-5"}`}>
      {backButton && <div className="mb-3">{backButton}</div>}
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[20px] font-semibold leading-tight tracking-tight">{title}</h1>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground sm:truncate">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-3">{tabs}</div>}
    </div>
  );
}
