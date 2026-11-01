"use client";

import { Archive, Inbox, Send, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Folders the backend actually supports. (There is no drafts storage yet.) */
export type Folder = "inbox" | "starred" | "sent" | "archive";

export const FOLDERS: { key: Folder; label: string; icon: LucideIcon; empty: string; hint: string }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox, empty: "Your inbox is empty", hint: "Replies from candidates land here." },
  { key: "starred", label: "Starred", icon: Star, empty: "No starred conversations", hint: "Star a conversation to keep it close." },
  { key: "sent", label: "Sent", icon: Send, empty: "Nothing sent yet", hint: "Emails you send to candidates appear here." },
  { key: "archive", label: "Archive", icon: Archive, empty: "Archive is empty", hint: "Archived conversations are kept here." },
];

export interface MailboxCountsLike {
  inbox: number;
  starred: number;
  sent: number;
  archive: number;
}

/** Folder list: a rail on wide screens, a scrollable tab row on small ones. */
export function MailFolders({
  current,
  onSelect,
  counts,
  orientation,
}: {
  current: Folder;
  onSelect: (folder: Folder) => void;
  counts: MailboxCountsLike;
  orientation: "vertical" | "horizontal";
}) {
  const vertical = orientation === "vertical";
  return (
    <nav aria-label="Mail folders" className={vertical ? "space-y-0.5" : "-mx-1 flex gap-1 overflow-x-auto px-1"}>
      {FOLDERS.map((f) => {
        const active = current === f.key;
        const count = counts[f.key];
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onSelect(f.key)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              vertical ? "w-full px-3 py-2" : "shrink-0 px-3 py-1.5",
              active ? "bg-surface text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <f.icon className={cn("size-4 shrink-0", active && "text-primary")} aria-hidden="true" />
            <span className={vertical ? "flex-1 text-left" : ""}>{f.label}</span>
            {count > 0 && (
              <span className="rounded-full bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
