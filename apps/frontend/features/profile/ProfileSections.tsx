"use client";

export function Card({ title, icon: Icon, action, children }: { title: string; icon?: React.ElementType; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
