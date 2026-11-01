"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAcceptHiringTeamInvitation } from "@/hooks/useJobs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GrovynMark } from "@/components/sidebar";
import { useAppStore } from "@/store/app.store";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  
  const { mutateAsync: acceptInvitation, isPending } = useAcceptHiringTeamInvitation();
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
        // Redirect to the job details page
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

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-2xl shadow-xl mx-auto">
      <GrovynMark size={48} />
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">
        Hiring Team Invitation
      </h1>
      
      {error ? (
        <div className="mt-6 w-full rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center text-muted-foreground">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p>Verifying your invitation...</p>
        </div>
      )}

      {error && (
        <button
          onClick={() => router.push("/")}
          className="mt-6 h-10 w-full rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          Go to Dashboard
        </button>
      )}
    </div>
  );
}

export default function AcceptJobInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -left-[10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>
      
      <div className="relative z-10 w-full">
        <Suspense fallback={
          <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        }>
          <AcceptInvitationContent />
        </Suspense>
      </div>
    </div>
  );
}
