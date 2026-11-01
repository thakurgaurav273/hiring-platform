"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PenSquare } from "lucide-react";
import { Guard } from "@/components/access-restricted";
import { PageHeader } from "@/components/app-shell";
import { SearchField } from "@/components/list-toolbar";
import { MailFolders, FOLDERS, type Folder } from "@/features/mail/MailSidebar";
import { MailThreadList, counterpart } from "@/features/mail/MailThreadList";
import { useMailboxCounts, useThreads, useUpdateThread } from "@/hooks/useMail";

export default function MailPage() {
  return (
    <Guard section="mail">
      <Suspense fallback={null}>
        <MailListContainer />
      </Suspense>
    </Guard>
  );
}

function MailListContainer() {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("folder") as Folder | null;
  const folder: Folder = FOLDERS.some((f) => f.key === requested) ? requested! : "inbox";
  const setFolder = (f: Folder) => router.replace(f === "inbox" ? "/mail" : `/mail?folder=${f}`, { scroll: false });

  const [q, setQ] = useState("");
  const { data: threads = [], isLoading } = useThreads(folder);
  const { data: counts = { inbox: 0, starred: 0, sent: 0, drafts: 0, archive: 0 } } = useMailboxCounts();
  const updateThread = useUpdateThread();

  const toggleStar = (id: string) => {
    const t = threads.find((x) => x.id === id);
    if (t) updateThread.mutate({ threadId: id, updates: { isStarred: !t.starred } });
  };

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      !query
        ? threads
        : threads.filter((t) => {
            const who = counterpart(t, folder).name.toLowerCase();
            return t.subject.toLowerCase().includes(query) || t.preview.toLowerCase().includes(query) || who.includes(query);
          }),
    [threads, query, folder]
  );
  const unread = threads.filter((t) => t.unread).length;
  const label = FOLDERS.find((f) => f.key === folder)!.label;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="Mail"
        description="Every conversation with candidates, in one place."
        actions={
          <Link
            href="/mail/compose"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground shadow-sm transition hover:bg-primary-hover"
          >
            <PenSquare className="size-3.5" /> Compose
          </Link>
        }
      />

      <div className="flex min-h-0 flex-1">
        {/* Folder rail (wide screens) */}
        <aside className="hidden w-56 shrink-0 border-r border-border px-3 py-4 md:block">
          <MailFolders current={folder} onSelect={setFolder} counts={counts} orientation="vertical" />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col" aria-label={label}>
          <div className="space-y-3 border-b border-border px-4 py-3 md:px-6">
            <div className="md:hidden">
              <MailFolders current={folder} onSelect={setFolder} counts={counts} orientation="horizontal" />
            </div>
            <div className="flex items-center gap-3">
              <SearchField value={q} onChange={setQ} placeholder={`Search ${label.toLowerCase()}`} label={`Search ${label.toLowerCase()}`} />
              <span className="ml-auto hidden text-[12px] text-muted-foreground sm:block" aria-live="polite">
                {isLoading ? null : query ? `${filtered.length} of ${threads.length}` : `${threads.length} ${threads.length === 1 ? "conversation" : "conversations"}${folder === "inbox" && unread ? ` · ${unread} unread` : ""}`}
              </span>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MailThreadList threads={filtered} folder={folder} loading={isLoading} searching={!!query} onToggleStar={toggleStar} />
          </div>
        </section>
      </div>
    </div>
  );
}
