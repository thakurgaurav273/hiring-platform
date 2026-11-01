"use client";

import { PageHeader, Avatar } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { Users, Bell, Plus, MoreHorizontal, User, Sun, Loader2, Palette, Info, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ProfileSection,
  ThemeSection,
  NotificationsSection,
  AboutSection,
  SettingsCard,
  SettingsField,
} from "@/features/settings/SettingsSections";
import { BrandingSettings } from "@/features/settings/branding/BrandingSettings";
import { CareersSettings } from "@/features/settings/CareersSettings";
import { useTheme } from "@/components/theme-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/api/users.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["administrator", "hiring_manager", "recruiter", "employee"]),
});

const TABS = ["profile", "appearance", "notifications", "branding", "careers", "users", "about"] as const;
type SettingsTab = (typeof TABS)[number];

export default function SettingsPage() {
  return (
    <Guard section="settings">
      {/* useSearchParams (for ?tab=) requires a Suspense boundary */}
      <Suspense fallback={null}>
        <SettingsInner />
      </Suspense>
    </Guard>
  );
}

function SettingsInner() {
  const can = useAppStore((s) => s.can);
  const canManageBranding = useAppStore((s) => !!s.workspace?.permissions.canManageBranding);
  const { brand } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as SettingsTab | null;
  const [ui, setUi] = useState({
    inviteOpen: false,
    tab: (requestedTab && TABS.includes(requestedTab) ? requestedTab : "appearance") as SettingsTab,
    userToDelete: null as string | null,
    userToUpdateRole: null as { id: string, role: string } | null,
  });

  const queryClient = useQueryClient();
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
    enabled: ui.tab === "users" && can("users"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "employee" },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: z.infer<typeof inviteSchema>) => usersService.inviteUser(data),
    onSuccess: () => {
      toast.success("Invitation sent");
      setUi(p => ({ ...p, inviteOpen: false }));
      reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      setUi(p => ({ ...p, userToDelete: null }));
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to deactivate user");
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: string }) => usersService.updateUserRole(id, role),
    onSuccess: () => {
      toast.success("User role updated");
      setUi(p => ({ ...p, userToUpdateRole: null }));
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update role");
    },
  });

  const onSubmit = (data: z.infer<typeof inviteSchema>) => {
    inviteMutation.mutate(data);
  };

  const tabs = [
    { v: "profile" as const,       l: "Profile",                i: User,    show: true },
    { v: "appearance" as const,    l: "My appearance",          i: Sun,     show: true },
    { v: "notifications" as const, l: "Notifications",          i: Bell,    show: true },
    { v: "branding" as const,      l: "Branding & Appearance",  i: Palette, show: canManageBranding },
    { v: "careers" as const,       l: "Careers & embed",        i: Globe,   show: canManageBranding || can("jobs") },
    { v: "users" as const,         l: "Users",                  i: Users,   show: can("users") },
    { v: "about" as const,         l: "About",                  i: Info,    show: true },
  ].filter((t) => t.show);

  const selectTab = (tab: SettingsTab) => {
    setUi(p => ({ ...p, tab }));
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Settings" }]} title="Settings" />

      {/* Tab bar */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl justify-center overflow-x-auto px-4 py-5 md:px-8">
          <div role="tablist" aria-label="Settings sections" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-2 p-1 shadow-xs">
            {tabs.map((t) => {
              const active = ui.tab === t.v;
              return (
                <button
                  key={t.v}
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTab(t.v)}
                  className={
                    "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[12.5px] font-medium transition " +
                    (active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {t.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className={`mx-auto pt-2 ${ui.tab === "branding" ? "max-w-6xl px-4 pb-10 md:px-8" : "max-w-3xl"}`}>
        {ui.tab === "profile"       && <ProfileSection />}
        {ui.tab === "appearance"    && <ThemeSection />}
        {ui.tab === "notifications" && <NotificationsSection />}
        {ui.tab === "branding"      && <BrandingSettings />}
        {ui.tab === "careers"       && (canManageBranding || can("jobs")) && <CareersSettings canEdit={canManageBranding} />}
        {ui.tab === "about"         && <AboutSection />}

        {ui.tab === "users" && can("users") && (
          <SettingsCard
            title="Users"
            action={
              <Dialog open={ui.inviteOpen} onOpenChange={(v) => setUi(p => ({ ...p, inviteOpen: v }))}>
                <DialogTrigger asChild>
                  <button className="h-8 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground hover:opacity-90">
                    <Plus className="h-3.5 w-3.5" /> Invite user
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Invite teammate</DialogTitle>
                      <DialogDescription>They&apos;ll receive an email invitation to join {brand.name}.</DialogDescription>
                    </DialogHeader>
                    <SettingsField label="Email">
                      <input {...register("email")} placeholder="name@company.com" className="input" />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </SettingsField>
                    <SettingsField label="Role">
                      <select {...register("role")} className="input">
                        <option value="administrator">Administrator</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="employee">Employee</option>
                      </select>
                      {errors.role && <p className="text-destructive text-xs mt-1">{errors.role.message}</p>}
                    </SettingsField>
                    <DialogFooter>
                      <button type="button" onClick={() => setUi(p => ({ ...p, inviteOpen: false }))} className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] font-medium hover:bg-secondary">Cancel</button>
                      <button type="submit" disabled={inviteMutation.isPending} className="h-9 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                        {inviteMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Send Invitation
                      </button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          >
            <div className="divide-y divide-border">
              {isLoading && <div className="py-8 text-center text-sm text-muted-foreground">Loading users...</div>}
              {usersData?.users.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <Avatar name={`${t.firstName} ${t.lastName}`} size={30} url={t.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{t.firstName} {t.lastName}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{t.email}</div>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium">
                    {t.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setUi(p => ({ ...p, userToUpdateRole: { id: t.id, role: t.role } }))}>
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setUi(p => ({ ...p, userToDelete: t.id }))}>
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {!isLoading && usersData?.users.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
              )}
            </div>

            {/* Deletion Dialog */}
            <Dialog open={!!ui.userToDelete} onOpenChange={(v) => !v && setUi(p => ({ ...p, userToDelete: null }))}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Deactivate User</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to deactivate this user? They will lose access to the system, but their data will remain intact.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button type="button" onClick={() => setUi(p => ({ ...p, userToDelete: null }))} className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] font-medium hover:bg-secondary">Cancel</button>
                  <button type="button" onClick={() => ui.userToDelete && deleteMutation.mutate(ui.userToDelete)} disabled={deleteMutation.isPending} className="h-9 rounded-md bg-destructive px-3 text-[13px] font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                    {deleteMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Deactivate
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Role Change Dialog */}
            <Dialog open={!!ui.userToUpdateRole} onOpenChange={(v) => !v && setUi(p => ({ ...p, userToUpdateRole: null }))}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Role</DialogTitle>
                  <DialogDescription>
                    Update the access level for this user in the workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SettingsField label="New Role">
                    <select
                      className="input"
                      value={ui.userToUpdateRole?.role || "employee"}
                      onChange={(e) => setUi(p => p.userToUpdateRole ? { ...p, userToUpdateRole: { ...p.userToUpdateRole, role: e.target.value } } : p)}
                    >
                      <option value="administrator">Administrator</option>
                      <option value="hiring_manager">Hiring Manager</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="employee">Employee</option>
                    </select>
                  </SettingsField>
                </div>
                <DialogFooter>
                  <button type="button" onClick={() => setUi(p => ({ ...p, userToUpdateRole: null }))} className="h-9 rounded-md border border-border bg-surface px-3 text-[13px] font-medium hover:bg-secondary">Cancel</button>
                  <button type="button" onClick={() => ui.userToUpdateRole && roleMutation.mutate(ui.userToUpdateRole)} disabled={roleMutation.isPending} className="h-9 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                    {roleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save Changes
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SettingsCard>
        )}
      </div>

    </div>
  );
}
