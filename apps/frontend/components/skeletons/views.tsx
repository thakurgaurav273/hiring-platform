import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";

export function JobDetail() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="surface-card p-5 lg:col-span-2 space-y-3">
        <ShadcnSkeleton className="h-4 w-28" />
        <ShadcnSkeleton className="h-3 w-full" />
        <ShadcnSkeleton className="h-3 w-5/6" />
        <ShadcnSkeleton className="h-3 w-4/6" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <ShadcnSkeleton className="h-16 rounded-lg" />
          <ShadcnSkeleton className="h-16 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-20" />
          <ShadcnSkeleton className="h-3 w-full" />
          <ShadcnSkeleton className="h-3 w-3/4" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <ShadcnSkeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <ShadcnSkeleton key={i} className="h-3 w-4/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  return (
    <>
      <div className="surface-card p-6 flex items-center gap-4">
        <ShadcnSkeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <ShadcnSkeleton className="h-5 w-48" />
          <ShadcnSkeleton className="h-3 w-32" />
          <ShadcnSkeleton className="h-3 w-56" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="surface-card p-6 space-y-4">
          <ShadcnSkeleton className="h-4 w-36" />
          <div className="grid gap-3 sm:grid-cols-2">
            <ShadcnSkeleton className="h-10 w-full rounded-lg" />
            <ShadcnSkeleton className="h-10 w-full rounded-lg" />
            <ShadcnSkeleton className="h-10 w-full rounded-lg" />
            <ShadcnSkeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}
