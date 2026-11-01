import Link from "next/link";
import { Mail } from "lucide-react";

interface RecentEmailsProps {
  variant?: "manager" | "employee";
  emails?: any[];
}

export function RecentEmails({ variant = "manager", emails = [] }: RecentEmailsProps) {
  return (
    <div className="surface-card">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-[13px] font-semibold">Recent mail</div>
        <Link href="/mail" className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground">
          Inbox
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {emails.length === 0 ? (
          <div className="px-5 py-4 text-[12px] text-muted-foreground">No recent emails.</div>
        ) : (
          emails.map((email: any) => (
            <div key={email.id} className="flex gap-3 px-5 py-3 transition hover:bg-secondary/20">
              <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary/50 text-foreground">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-[12.5px] font-medium">{email.fromUserId ? "Internal" : email.subject}</div>
                  <div className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(email.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="truncate text-[12px] text-muted-foreground">{email.subject}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
