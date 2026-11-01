"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAcceptHiringTeamInvitation } from "@/hooks/useJobs";
import { toast } from "sonner";
import { useAppStore } from "@/store/app.store";
import { useTheme } from "@/components/theme-provider";
import { AuthButton, AuthLoading, AuthShell, AuthStatus } from "@/components/auth/auth-shell";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const { mutateAsync: acceptInvitation } = useAcceptHiringTeamInvitation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link.");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please log in to accept this invitation.");
      // Redirect to login, but store the redirect URL so they can come back
      const currentUrl = encodeURIComponent(`/accept-job-invitation?token=${token}`);
      router.push(`/login?redirect=${currentUrl}`);
      return;
    }
    const processToken = async () => {
      try {
        const res = await acceptInvitation(token);
        toast.success("Successfully joined the hiring team!");
        if (res?.data?.jobId) {
          router.push(`/jobs/${res.data.jobId}`);
        } else {
          router.push(`/jobs`);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to accept invitation. It may have expired.");
      }
    };
    processToken();
  }, [token, isAuthenticated, acceptInvitation, router]);

  if (error) {
    return (
      <AuthStatus
        tone="error"
        title="Hiring team invitation"
        action={<AuthButton onClick={() => router.push("/dashboard")}>Go to dashboard</AuthButton>}
      >
        {error}
      </AuthStatus>
    );
  }
  return <AuthLoading label="Verifying your invitation…" />;
}

export default function AcceptJobInvitationPage() {
  // Signed-in users already have their organization's theme applied globally.
  const { brand } = useTheme();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  return (
    <AuthShell organization={isAuthenticated ? brand : null}>
      <Suspense fallback={<AuthLoading label="Loading…" />}>
        <AcceptInvitationContent />
      </Suspense>
    </AuthShell>
  );
}
