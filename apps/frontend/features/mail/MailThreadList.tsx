"use client";

import Link from "next/link";
import { PenSquare, Star } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { Skeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import type { Thread } from "@/services/api/mail.service";
import { cn } from "@/lib/utils";
import { FOLDERS, type Folder } from "./MailSidebar";

/** "14:05" today, "Mon" this week, "3 Oct" this year, otherwise "3 Oct 2025". */
export function mailDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 6) return d.toLocaleDateString(undefined, { weekday: "short" });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Who the conversation is with, as seen from this mailbox. */
export function counterpart(t: Thread, folder: Folder) {
  if (t.candidate) return { name: t.candidate.name, seed: t.candidate.email };
  const first = t.messages?.[0];
  if (!first) return { name: "Unknown", seed: t.id };
  if (folder === "sent") return { name: first.to, seed: first.to };
  const raw = first.fromName || first.from;
  const name = raw.includes("<") ? raw.split("<")[0].trim() : raw.includes("@") ? raw.split("@")[0] : raw || "Unknown";
  return { name, seed: first.from || name };
}

export function MailThreadList({
  threads,
  folder,
  loading,
  searching,
  onToggleStar,
}: {
  threads: Thread[];
  folder: Folder;
  loading: boolean;
  searching: boolean;
  onToggleStar: (threadId: string) => void;
}) {
  const meta = FOLDERS.find((f) => f.key === folder)!;

  if (loading) return <Skeleton.MailRow count={6} />;

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
          <meta.icon className="size-5" aria-hidden="true" />
        </span>
        <p className="text-[13.5px] font-medium">{searching ? "No conversations match your search" : meta.empty}</p>
        <p className="max-w-xs text-[12.5px] text-muted-foreground">{searching ? "Try a different keyword." : meta.hint}</p>
        {!searching && (folder === "inbox" || folder === "sent") && (
          <Button asChild size="sm" className="mt-2">
            <Link href="/mail/compose">
              <PenSquare /> Write an email
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {threads.map((t) => {
        const who = counterpart(t, folder);
        const last = t.messages?.[t.messages.length - 1];
        const count = t.messages?.length ?? 0;
        return (
          <li key={t.id} className={cn("group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/40", t.unread && "bg-primary/[0.03]")}>
            {t.unread && <span className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />}
            <Avatar name={who.name} seed={who.seed} size={32} />
            <Link href={`/mail/${t.id}`} className="min-w-0 flex-1 focus-visible:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <div className="flex items-baseline gap-2">
                <span className={cn("truncate text-[13.5px]", t.unread ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>
                  {folder === "sent" && !t.candidate ? `To: ${who.name}` : who.name}
                </span>
                {count > 1 && <span className="shrink-0 text-[11.5px] text-muted-foreground">{count}</span>}
                <span className={cn("ml-auto shrink-0 text-[11.5px] tabular-nums", t.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {mailDate(t.lastMessageAt ?? last?.at)}
                </span>
              </div>
              <div className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-[12.5px]">
                <span className={cn("shrink-0 truncate", t.unread ? "font-medium text-foreground" : "text-foreground/80", "max-w-[60%]")}>{t.subject || "(no subject)"}</span>
                {t.preview && <span className="truncate text-muted-foreground">– {t.preview}</span>}
              </div>
              <span className="sr-only">{t.unread ? "Unread" : ""}</span>
            </Link>
            <button
              type="button"
              onClick={() => onToggleStar(t.id)}
              className={cn(
                "relative z-10 -mr-1 grid size-7 shrink-0 place-items-center rounded-md transition hover:bg-secondary",
                t.starred ? "text-warning" : "text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              )}
              aria-label={t.starred ? "Remove star" : "Star conversation"}
              aria-pressed={t.starred}
            >
              <Star className={cn("size-4", t.starred && "fill-warning")} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
