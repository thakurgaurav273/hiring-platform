"use client";

import { Inbox, Star, Send, Archive, PenSquare, X } from "lucide-react";

export type Folder = "inbox" | "starred" | "sent" | "drafts" | "archive";

export interface MailSidebarProps {
  currentFolder: Folder;
  onSelectFolder: (folder: Folder) => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    inbox: number;
    starred: number;
    sent: number;
    drafts: number;
    archive: number;
  };
}

export function MailSidebar({
  currentFolder,
  onSelectFolder,
  isOpen,
  onClose,
  counts,
}: MailSidebarProps) {
  const folders = [
    { k: "inbox" as const, l: "Inbox", i: Inbox, count: counts.inbox },
    { k: "starred" as const, l: "Starred", i: Star, count: counts.starred },
    { k: "sent" as const, l: "Sent", i: Send, count: counts.sent },
    { k: "drafts" as const, l: "Drafts", i: PenSquare, count: counts.drafts },
    { k: "archive" as const, l: "Archive", i: Archive, count: counts.archive },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div 
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" 
        onClick={onClose} 
      />
      <aside className="animate-in-up absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-border bg-surface-2 p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Folders
          </div>
          <button 
            onClick={onClose} 
            className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" 
            aria-label="Close folders"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {folders.map((f) => (
          <button 
            key={f.k} 
            onClick={() => {
              onSelectFolder(f.k);
              onClose();
            }} 
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] ${
              currentFolder === f.k 
                ? "bg-sidebar-accent font-medium" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <f.i className="h-4 w-4" />
            <span className="flex-1 text-left">{f.l}</span>
            {f.count > 0 && <span className="text-[11px]">{f.count}</span>}
          </button>
        ))}
      </aside>
    </div>
  );
}
