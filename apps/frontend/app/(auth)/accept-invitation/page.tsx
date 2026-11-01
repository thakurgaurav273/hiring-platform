"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Mail, User } from "lucide-react";
import { useState, useEffect, useMemo, Suspense } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usersService, type InvitationDetails } from "@/services/api/users.service";
import { useTheme } from "@/components/theme-provider";
import { themeStyle } from "@/lib/theme/engine";
import { PLATFORM_BRANDING } from "@/lib/theme/platform";
import {
  AuthButton,
  AuthHeading,
  AuthInput,
  AuthLoading,
  AuthShell,
  AuthStatus,
} from "@/components/auth/auth-shell";

const acceptInvitationSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AcceptInvitationValues = z.infer<typeof acceptInvitationSchema>;

type InviteState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; invite: InvitationDetails }
  | { status: "done"; invite: InvitationDetails };

function AcceptInvitation() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const { mode } = useTheme();
  const [state, setState] = useState<InviteState>({ status: "loading" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: "", password: "" },
  });

  useEffect(() => {
    if (!token) {
      setState({ status: "invalid" });
      return;
    }
    usersService
      .getInvitation(token)
      .then((invite) => setState({ status: "ready", invite }))
      .catch(() => setState({ status: "invalid" }));
  }, [token]);

  // The invitation token is validated by the server, so the inviting
  // organization is known reliably and its branding can be shown here. It is
  // scoped to this page and not saved as the global theme.
  const invite = state.status === "ready" || state.status === "done" ? state.invite : null;
  const branding = invite?.organization.branding;
  const scopedTheme = useMemo(
    () =>
      branding
        ? themeStyle(
            {
              themePreset: branding.themePreset,
              primaryColor: branding.primaryColor,
              secondaryColor: branding.secondaryColor,
              fontPreset: branding.fontPreset,
              radiusPreset: branding.radiusPreset,
              sidebarStyle: "solid",
            },
            mode
          )
        : undefined,
    [branding, mode]
  );
  const organization = branding ? { name: branding.displayName, logoUrl: branding.logoUrl } : null;

  const onSubmit = async (data: AcceptInvitationValues) => {
    if (!token || !invite) return;
    try {
      await usersService.acceptInvitation(token, data);
      setState({ status: "done", invite });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to accept invitation");
    }
  };

  return (
    <AuthShell organization={organization} themeStyle={scopedTheme}>
      {state.status === "loading" && <AuthLoading label="Loading invitation…" />}

      {state.status === "invalid" && (
        <AuthStatus
          tone="error"
          title="Invalid link"
          action={<AuthButton onClick={() => router.push("/login")}>Go to sign in</AuthButton>}
        >
          This invitation link is invalid or has expired. Please ask your administrator to send a new one.
        </AuthStatus>
      )}

      {state.status === "ready" && (
        <>
          <AuthHeading
            title="Set up your account"
            description={
              <>
                You&apos;ve been invited to join{" "}
                <span className="font-medium text-foreground">{state.invite.organization.name}</span> on{" "}
                {PLATFORM_BRANDING.productName}.
              </>
            }
          />
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-5">
            <AuthInput id="email" label="Email" icon={Mail} type="email" value={state.invite.email} disabled readOnly />
            <AuthInput
              id="name"
              label="Full name"
              icon={User}
              autoComplete="name"
              autoFocus
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />
            <AuthInput
              id="password"
              label="Password"
              icon={Lock}
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />
            <AuthButton type="submit" loading={isSubmitting} loadingText="Creating account…">
              Accept invitation
            </AuthButton>
          </form>
        </>
      )}

      {state.status === "done" && (
        <AuthStatus
          tone="success"
          title="Account created"
          action={<AuthButton onClick={() => router.push("/login")}>Go to sign in</AuthButton>}
        >
          Your account is ready. Sign in with your email and the password you just set.
        </AuthStatus>
      )}
    </AuthShell>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthLoading label="Loading invitation…" />
        </AuthShell>
      }
    >
      <AcceptInvitation />
    </Suspense>
  );
}
