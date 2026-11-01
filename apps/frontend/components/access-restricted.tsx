"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import type { Section } from "@/store/app.store";

export function AccessRestricted({ section }: { section?: string }) {
  const role = useAppStore((s) => s.role);
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-12">
      <div className="surface-card max-w-md w-full p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-[22px] font-semibold tracking-tight">Access restricted</h1>
        <p className="mt-2 text-[13.5px] text-muted-foreground">
          Your role <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11.5px] font-medium text-foreground">{role}</span> doesn&apos;t have permission to view{" "}
          {section ? <span className="font-medium text-foreground">{section}</span> : "this page"}. Please contact your administrator if you believe this is a mistake.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link href="/dashboard" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[12.5px] font-medium hover:bg-secondary">
            <ArrowLeft className="h-3.5 w-3.5" /> Go back
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Guard({ section, children }: { section: Section; children: React.ReactNode }) {
  const can = useAppStore((s) => s.can);
  if (!can(section)) return <AccessRestricted section={section} />;
  return <>{children}</>;
}
