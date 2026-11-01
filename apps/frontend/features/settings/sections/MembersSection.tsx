"use client";

import { errorMessage } from "@/lib/error-message";
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2, MoreHorizontal, Search, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app.store";
import { usersService, type Member } from "@/services/api/users.service";
import { TablePagination, headerText, usePageSize } from "@/components/data-table";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, SectionHeader, SettingsField } from "@/features/settings/SettingsSections";
import { cn } from "@/lib/utils";

const ROLES = ["administrator", "hiring_manager", "recruiter", "employee"] as const;
type RoleKey = (typeof ROLES)[number];

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(ROLES),
});
type InviteValues = z.infer<typeof inviteSchema>;

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Role chooser shown as radio cards with what each role can do. */
function RolePicker({ value, onChange, name }: { value: RoleKey; onChange: (r: RoleKey) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label="Role" className="grid gap-2">
      {ROLES.map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            onClick={() => onChange(r)}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              active ? "border-primary bg-primary/5" : "border-border hover:border-border-strong"
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
              )}
              aria-hidden="true"
            >
              {active && <Check className="size-2.5" />}
            </span>
            <span>
              <span className="block text-[13px] font-medium">{ROLE_LABELS[r]}</span>
              <span className="block text-[12px] text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        role === "administrator" ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

export function MembersSection() {
  const queryClient = useQueryClient();
  const me = useAppStore((s) => s.authUser);
  const orgName = useAppStore((s) => s.workspace?.branding.displayName ?? "your workspace");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | RoleKey>("");
  const [status, setStatus] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("members");
  const q = useDebounced(search.trim());
  useEffect(() => setPage(1), [q, role, status]);

  const params = { page, limit: pageSize, ...(q ? { search: q } : {}), ...(role ? { role } : {}), ...(status ? { isActive: status } : {}) };
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["users", params],
    queryFn: () => usersService.getUsers(params),
    placeholderData: keepPreviousData,
  });
  const members = data?.users ?? [];
  const total = data?.pagination.total ?? 0;
  const filtered = !!(q || role || status);

  // Dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<{ member: Member; role: RoleKey } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Member | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });
  const errMsg = (e: unknown, fallback: string) => errorMessage(e, fallback);

  const invite = useMutation({
    mutationFn: (v: InviteValues) => usersService.inviteUser(v),
    onSuccess: (_d, v) => {
      toast.success(`Invitation sent to ${v.email}`);
      setInviteOpen(false);
      inviteForm.reset({ email: "", role: "employee" });
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't send the invitation")),
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: RoleKey }) => usersService.updateUserRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      setRoleTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't change the role")),
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      toast.success("Member deactivated");
      setDeactivateTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't deactivate this member")),
  });
  const reactivate = useMutation({
    mutationFn: (id: string) => usersService.reactivateUser(id),
    onSuccess: () => {
      toast.success("Member reactivated");
      invalidate();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't reactivate this member")),
  });

  const inviteForm = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { email: "", role: "employee" } });
  const inviteRole = inviteForm.watch("role");

  const nameOf = (m: Member) => `${m.firstName} ${m.lastName}`.trim() || m.email;

  return (
    <div>
      <SectionHeader
        title="Members"
        description={`People who can sign in to ${orgName}, and what they can do.`}
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> Invite member
          </Button>
        }
      />

      <section aria-label="Members" className="surface-card relative flex max-h-[calc(100vh-19rem)] min-h-[280px] flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search members"
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2">
            <select value={role} onChange={(e) => setRole(e.target.value as "" | RoleKey)} aria-label="Filter by role" className="input w-auto min-w-[140px]">
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as "" | "true" | "false")} aria-label="Filter by status" className="input w-auto min-w-[130px]">
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Column headings (desktop) — outside the scroll area */}
        <div className={`hidden shrink-0 grid-cols-[minmax(0,1fr)_150px_110px_110px_44px] gap-4 overflow-hidden border-b border-border bg-surface-2 px-4 py-2 [scrollbar-gutter:stable] md:grid ${headerText}`}>
          <span>Member</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span className="sr-only">Actions</span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] scrollbar-thin">

        {isLoading ? (
          <div className="divide-y divide-border">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[13px] text-muted-foreground">Couldn&apos;t load members. Try again shortly.</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Users className="size-5" />
            </span>
            <p className="text-[13.5px] font-medium">{filtered ? "No members match these filters" : "No members yet"}</p>
            {filtered ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setRole("");
                  setStatus("");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus /> Invite your first teammate
              </Button>
            )}
          </div>
        ) : (
          <ul className={cn("divide-y divide-border transition-opacity", isFetching && "opacity-70")} aria-busy={isFetching}>
            {members.map((m) => {
              const isMe = m.id === me?.id;
              return (
                <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_150px_110px_110px_44px]">
                  <div className={cn("flex min-w-0 items-center gap-3", !m.isActive && "opacity-60")}>
                    <Avatar name={nameOf(m)} seed={m.email} size={36} url={m.avatarUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13.5px] font-medium">{nameOf(m)}</span>
                        {isMe && <span className="rounded bg-secondary px-1.5 py-px text-[10.5px] font-medium text-muted-foreground">You</span>}
                      </div>
                      <div className="truncate text-[12px] text-muted-foreground">
                        {m.email}
                        {m.title ? ` · ${m.title}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <RoleBadge role={m.role} />
                  </div>
                  <div className="hidden md:block">
                    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px]", m.isActive ? "text-foreground" : "text-muted-foreground")}>
                      <span className={cn("size-1.5 rounded-full", m.isActive ? "bg-success" : "bg-muted-foreground")} aria-hidden="true" />
                      {m.isActive ? "Active" : "Deactivated"}
                    </span>
                  </div>
                  <div className="hidden text-[12.5px] text-muted-foreground md:block">
                    {new Date(m.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="md:hidden">
                      <RoleBadge role={m.role} />
                    </span>
                    {isMe ? (
                      <span className="size-8" aria-hidden="true" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${nameOf(m)}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                          <DropdownMenuItem disabled={!m.isActive} onClick={() => setRoleTarget({ member: m, role: m.role as RoleKey })}>
                            Change role
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${m.email}`}>Send email</a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {m.isActive ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeactivateTarget(m)}>
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled={reactivate.isPending} onClick={() => reactivate.mutate(m.id)}>
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        </div>

        {/* Footer */}
        {total > 0 && (
          <div className="shrink-0 border-t border-border bg-surface">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              noun={total === 1 ? "member" : "members"}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          </div>
        )}
      </section>

      {/* Invite */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(v) => {
          setInviteOpen(v);
          if (!v) inviteForm.reset({ email: "", role: "employee" });
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={inviteForm.handleSubmit((v) => invite.mutate(v))} noValidate>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
              <DialogDescription>They&apos;ll get an email with a link to join {orgName}.</DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-5">
              <SettingsField label="Email address" htmlFor="invite-email" error={inviteForm.formState.errors.email?.message}>
                <input
                  id="invite-email"
                  type="email"
                  autoComplete="off"
                  autoFocus
                  placeholder="name@company.com"
                  aria-invalid={!!inviteForm.formState.errors.email}
                  aria-describedby={inviteForm.formState.errors.email ? "invite-email-error" : undefined}
                  className="input"
                  {...inviteForm.register("email")}
                />
              </SettingsField>
              <div>
                <div className="mb-1.5 text-[12.5px] font-medium">Role</div>
                <RolePicker name="invite-role" value={inviteRole} onChange={(r) => inviteForm.setValue("role", r, { shouldDirty: true })} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && <Loader2 className="animate-spin" />} Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change role */}
      <Dialog open={!!roleTarget} onOpenChange={(v) => !v && setRoleTarget(null)}>
        <DialogContent className="max-w-md">
          {roleTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Change role</DialogTitle>
                <DialogDescription>
                  Choose what {nameOf(roleTarget.member)} can do in {orgName}.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5">
                <RolePicker name="change-role" value={roleTarget.role} onChange={(r) => setRoleTarget({ ...roleTarget, role: r })} />
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setRoleTarget(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={changeRole.isPending || roleTarget.role === roleTarget.member.role}
                  onClick={() => changeRole.mutate({ id: roleTarget.member.id, role: roleTarget.role })}
                >
                  {changeRole.isPending && <Loader2 className="animate-spin" />} Save role
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget ? nameOf(deactivateTarget) : "member"}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to sign in. Their jobs, notes and interview history stay as they are, and you can
              reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deactivate.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deactivateTarget) deactivate.mutate(deactivateTarget.id);
              }}
            >
              {deactivate.isPending && <Loader2 className="animate-spin" />} Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
