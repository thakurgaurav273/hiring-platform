"use client";

import { use } from "react";
import { Guard } from "@/components/access-restricted";
import { useAppStore } from "@/store/app.store";
import { MailReader } from "@/features/mail/MailReader";
import { useThread } from "@/hooks/useMail";

export default function MailReaderPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = use(params);
  
  return (
    <Guard section="mail">
      <div className="flex h-screen w-full flex-col">
        <MailReaderWrapper threadId={threadId} />
      </div>
    </Guard>
  );
}

function MailReaderWrapper({ threadId }: { threadId: string }) {
  const { data: thread, isLoading } = useThread(threadId);

  if (isLoading) {
    return <div className="p-8 text-center text-[12.5px] text-muted-foreground">Loading thread...</div>;
  }

  return <MailReader thread={thread} />;
}
