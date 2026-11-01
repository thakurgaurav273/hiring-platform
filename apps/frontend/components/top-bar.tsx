"use client";

import { useRouter } from "next/navigation";
import { Bell, Settings as SettingsIcon, Sun, Moon, LogOut } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import {
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Avatar } from "@/components/app-shell";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

export function UserMenuButton() {
  const role = useAppStore((s) => s.role);
  const user = useAppStore((s) => s.user)();
  return (
    <button className="ml-1 flex h-9 items-center gap-2 rounded-lg pl-1 pr-2 hover:bg-secondary">
      <Avatar name={user.name} seed={user.email} size={28} />
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-[12.5px] font-medium">{user.name.split(" ")[0]}</span>
        <span className="block text-[10.5px] text-muted-foreground">{role}</span>
      </span>
    </button>
  );
}

export function UserMenuContent({ router }: { router: ReturnType<typeof useRouter> }) {
  const user = useAppStore((s) => s.user)();
  const logout = useAppStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <DropdownMenuContent align="end" className="w-64">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <Avatar name={user.name} seed={user.email} size={36} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium">{user.name}</div>
          <div className="truncate text-[11.5px] text-muted-foreground">{user.email}</div>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => router.push("/settings")}>
        <SettingsIcon className="h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
        <LogOut className="h-4 w-4" /> Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function NotificationsMenu() {
  const router = useRouter();

  const { data, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications = data?.notifications ?? [];

  const handleNotificationClick = (id: string, link?: string | null) => {
    markReadMutation.mutate(id);
    if (link) router.push(link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Bell className="h-[17px] w-[17px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9.5px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <div className="text-[13px] font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 px-3.5 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-[12.5px] font-medium text-muted-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground/70">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.link)}
                className="flex w-full items-start gap-2.5 border-b border-border px-3.5 py-3 text-left hover:bg-secondary/60 transition-colors"
              >
                <span
                  className={
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                    (!n.isRead ? "bg-primary" : "bg-transparent")
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium leading-tight">{n.title}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{n.body}</div>
                </div>
                <div className="shrink-0 text-[10.5px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
    </button>
  );
}
