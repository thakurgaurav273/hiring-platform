"use client";

import { PageHeader, Avatar } from "@/components/app-shell";
import { useAppStore } from "@/store/app.store";
import { Guard } from "@/components/access-restricted";
import { Users, Bell, Plus, MoreHorizontal, User, Sun, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { TEAM } from "@/constants/settings.constants";
import {
  ProfileSection,
  ThemeSection,
  NotificationsSection,
  SettingsCard,
  SettingsField,
} from "@/features/settings/SettingsSections";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/api/users.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["administrator", "hiring_manager", "recruiter", "employee"]),
});

export default function SettingsPage() {
  return (
    <Guard section="settings">
      <SettingsInner />
    </Guard>
  );
}

function SettingsInner() {
  const can = useAppStore((s) => s.can);
  const [ui, setUi] = useState({
    inviteOpen: false,
    tab: "theme" as "theme" | "notifications" | "users" | "profile",
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
    { v: "profile" as const, l: "Profile",       i: User,  show: true },
    { v: "theme" as const,   l: "Theme",          i: Sun,   show: true },
    { v: "notifications" as const, l: "Notifications", i: Bell, show: true },
    { v: "users" as const,   l: "Users",          i: Users, show: can("users") },
  ].filter((t) => t.show);

  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Settings" }]} title="Settings" />

      {/* Tab bar */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl justify-center px-4 py-5 md:px-8">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1 shadow-xs">
            {tabs.map((t) => {
              const active = ui.tab === t.v;
              return (
                <button
                  key={t.v}
                  onClick={() => setUi(p => ({ ...p, tab: t.v }))}
                  className={
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-medium transition " +
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
      <div className="mx-auto max-w-3xl pt-2">
        {ui.tab === "profile"       && <ProfileSection />}
        {ui.tab === "theme"         && <ThemeSection />}
        {ui.tab === "notifications" && <NotificationsSection />}

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
                      <DialogDescription>They&apos;ll receive an email invitation to join your Grovyn workspace.</DialogDescription>
                    </DialogHeader>
                    <SettingsField label="Email">
                      <input {...register("email")} placeholder="name@company.com" className="input" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </SettingsField>
                    <SettingsField label="Role">
                      <select {...register("role")} className="input">
                        <option value="administrator">Administrator</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="employee">Employee</option>
                      </select>
                      {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
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

      <style>{`.input { height: 40px; width: 100%; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); padding: 0 12px; font-size: 13px; outline: none; }`}</style>
    </div>
  );
}
