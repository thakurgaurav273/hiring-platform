"use client";

import Link from "next/link";
import { Search, Menu, Star } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { Skeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { candidateById } from "@/lib/mock-data";
import type { Thread } from "@/services/api/mail.service";

export interface MailThreadListProps {
  threads: Thread[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  folderName: string;
  onOpenFolders: () => void;
  loading: boolean;
  onToggleStar: (threadId: string) => void;
}

export function MailThreadList({
  threads,
  searchQuery,
  onSearchChange,
  folderName,
  onOpenFolders,
  loading,
  onToggleStar,
}: MailThreadListProps) {
  return (
    <div className="flex-col bg-background min-h-0 w-full flex">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <button
          onClick={onOpenFolders}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Open folders"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${folderName}…`}
            className="h-8 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-[12.5px] outline-none focus:border-ring"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading && <Skeleton.MailRow count={6} />}
        
        {!loading && threads.length === 0 && (
          <div className="p-8 text-center text-[12.5px] text-muted-foreground">
            No emails in {folderName}.
          </div>
        )}
        
        {!loading && threads.map((t) => {
          let name = "Unknown";
          let avatarSeed = "unknown";
          
          if (t.candidateId) {
            const c = candidateById(t.candidateId);
            if (c) {
              name = c.name;
              avatarSeed = c.avatarSeed || c.name;
            }
          } else if (t.messages && t.messages.length > 0) {
             const firstMsg = t.messages[0];
             if (firstMsg.fromName) {
                 name = firstMsg.fromName;
             } else {
                 let rawFrom = firstMsg.from;
                 if (rawFrom.includes('<')) {
                     name = rawFrom.split('<')[0].trim();
                 } else if (rawFrom.includes('@')) {
                     name = rawFrom.split('@')[0];
                 } else {
                     name = rawFrom;
                 }
             }
             avatarSeed = firstMsg.from;
          }
          
          const lastMsg = t.messages?.[t.messages.length - 1];
          const displayAt = lastMsg ? new Date(lastMsg.at).toLocaleDateString() : "";
          
          return (
            <div 
              key={t.id} 
              className="group flex w-full items-start gap-2 border-b border-border px-3 py-3 transition hover:bg-secondary/40"
            >
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onToggleStar(t.id); 
                  toast(t.starred ? "Removed star" : "Starred"); 
                }}
                className="mt-0.5 grid h-5 w-5 place-items-center rounded text-muted-foreground hover:text-[oklch(0.78_0.16_75)]"
                aria-label="Toggle star"
              >
                <Star className={`h-4 w-4 ${t.starred ? "fill-[oklch(0.78_0.16_75)] text-[oklch(0.78_0.16_75)]" : ""}`} />
              </button>
              
              <Link 
                href={`/mail/${t.id}`} 
                className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
              >
                <Avatar name={name} seed={avatarSeed} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`truncate text-[12.5px] ${t.unread ? "font-semibold" : "font-medium"}`}>
                      {name}
                    </div>
                    <div className="ml-auto text-[10.5px] text-muted-foreground">
                      {displayAt}
                    </div>
                  </div>
                  <div className={`truncate text-[12px] ${t.unread ? "text-foreground" : "text-muted-foreground"}`}>
                    {t.subject}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {t.preview}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
