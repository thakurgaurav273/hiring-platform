"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallback = "/", label = "Back" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 2) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
