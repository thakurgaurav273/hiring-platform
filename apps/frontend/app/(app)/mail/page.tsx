"use client";

import Link from "next/link";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { PenSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { MailSidebar, type Folder } from "@/features/mail/MailSidebar";
import { MailThreadList } from "@/features/mail/MailThreadList";
import { useThreads, useMailboxCounts, useUpdateThread } from "@/hooks/useMail";

export default function MailPage() {
  return (
    <Guard section="mail">
      <MailListContainer />
    </Guard>
  );
}

function MailListContainer() {
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<Folder>("inbox");
  const [foldersOpen, setFoldersOpen] = useState(false);

  const { data: threads = [], isLoading: threadsLoading } = useThreads(folder);
  const { data: counts = { inbox: 0, starred: 0, sent: 0, drafts: 0, archive: 0 } } = useMailboxCounts();
  const updateThread = useUpdateThread();

  const toggleStar = (id: string) => {
    const t = threads.find(x => x.id === id);
    if (t) {
      updateThread.mutate({ threadId: id, updates: { isStarred: !t.starred } });
    }
  };

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      if (q) {
        const query = q.toLowerCase();
        if (
          !t.subject.toLowerCase().includes(query) &&
          !t.preview.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [threads, q]);

  return (
    <div>
      <PageHeader 
        breadcrumbs={[{ label: "Workspace" }, { label: "Mail" }]} 
        title="Mail" 
        description="Unified inbox across every candidate conversation." 
        actions={
          <Link 
            href="/mail/compose" 
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-[color:var(--color-primary-hover)]"
          >
            <PenSquare className="h-3.5 w-3.5" /> Compose
          </Link>
        } 
      />

      <div className="flex h-[calc(100vh-4rem-140px)] w-full border-t border-border relative">
        <MailSidebar
          currentFolder={folder}
          onSelectFolder={setFolder}
          isOpen={foldersOpen}
          onClose={() => setFoldersOpen(false)}
          counts={counts}
        />
        
        <MailThreadList
          threads={filtered}
          searchQuery={q}
          onSearchChange={setQ}
          folderName={folder}
          onOpenFolders={() => setFoldersOpen(true)}
          loading={threadsLoading}
          onToggleStar={toggleStar}
        />
      </div>
    </div>
  );
}
