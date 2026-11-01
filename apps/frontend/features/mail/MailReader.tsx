"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { ArrowLeft, Archive, Reply, Forward, Paperclip, Sparkles, Send, X, Trash2 } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { toast } from "sonner";
import { candidateById } from "@/lib/mock-data";
import { useUpdateThread, useReplyToEmail, useDeleteThread } from "@/hooks/useMail";
import { type Thread } from "@/services/api/mail.service";
import { useState } from "react";
import { useAppStore } from "@/store/app.store";

type Attachment = { id: string; name: string; size: string; content?: string; mimeType?: string };

export interface MailReaderProps {
  thread: Thread | undefined;
}

export function MailReader({ thread }: MailReaderProps) {
  const router = useRouter();
  const updateThread = useUpdateThread();
  const replyToEmail = useReplyToEmail();
  const deleteThread = useDeleteThread();
  const user = useAppStore((s) => s.user)();
  
  const [isReplying, setIsReplying] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { reply: "" } });
  const replyValue = watch("reply");

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const items: Attachment[] = [];
    for (const f of Array.from(files)) {
      const b64 = await toBase64(f);
      items.push({
        id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        content: b64,
        mimeType: f.type,
      });
    }
    setAttachments((p) => [...p, ...items]);
  };

  const cand = thread?.candidateId ? candidateById(thread.candidateId) : null;
  const lastMsg = thread?.messages[thread.messages.length - 1];
  const replyToAddress = lastMsg?.from === user.email ? lastMsg?.to : lastMsg?.from;

  const submitReply: SubmitHandler<{ reply: string }> = (data) => {
    if (!data.reply.trim()) return;
    
    const formattedAttachments = attachments.map(a => ({
      filename: a.name,
      content: a.content?.split(',')[1] || "", // extract base64 data
      contentType: a.mimeType || "application/octet-stream"
    })).filter(a => a.content);

    if (thread?.id) {
      replyToEmail.mutate(
        { 
          emailId: lastMsg?.id || thread.id, 
          data: { 
            body: data.reply,
            attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined,
          } 
        },
        {
          onSuccess: () => {
            toast.success("Reply sent"); 
            reset(); 
            setAttachments([]);
            setIsReplying(false); 
          }
        }
      );
    }
  };

  if (!thread) {
    return (
      <div className="flex-1 flex-col bg-surface-2/30 min-w-0 flex">
        <div className="flex shrink-0 items-center border-b border-border bg-background px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push("/mail")}
            className="mr-3 rounded-md p-1 hover:bg-secondary text-muted-foreground"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-[14px] font-semibold text-muted-foreground">Thread not found</div>
        </div>
        <div className="grid h-full place-items-center text-[13px] text-muted-foreground">
          The conversation you're looking for does not exist.
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 flex-col bg-surface-2/30 min-w-0 flex h-full">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3 sm:px-6">
        <Link
          href="/mail"
          className="mr-3 rounded-md p-1 hover:bg-secondary text-muted-foreground"
          aria-label="Back to list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{thread.subject}</div>
          <div className="truncate text-[11.5px] text-muted-foreground">
            Conversation with{" "}
            {cand ? (
              <Link href={`/candidates/${cand.id}`} className="font-medium hover:underline">
                {cand.name}
              </Link>
            ) : (
              "Unknown"
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button 
            onClick={() => { 
              if (thread?.id) {
                deleteThread.mutate(thread.id); 
                toast("Thread deleted"); 
                router.push("/mail");
              }
            }} 
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive" 
            aria-label="Trash"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => { 
              if (thread?.id) {
                updateThread.mutate({ threadId: thread.id, updates: { isArchived: true } }); 
                toast("Archived"); 
                router.push("/mail");
              }
            }} 
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" 
            aria-label="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-background px-4 py-2 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-2">
          {thread.messages.map((m, i) => (
            <div key={i} className="group">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.fromName || m.from} size={36} />
                  <div>
                    <div className="text-[14px] font-medium text-foreground">
                      {m.fromName || (m.from.includes('<') ? m.from.split('<')[0].trim() : (m.from.includes('@') ? m.from.split('@')[0] : m.from))}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground">to {m.to}</div>
                  </div>
                </div>
                <div className="text-[11.5px] text-muted-foreground">{m.at}</div>
              </div>
              <div className="pl-12 pr-4 text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap pb-4">
                {m.body}
              </div>
              
              {m.attachments && m.attachments.length > 0 && (
                <div className="pl-12 pr-4 pb-6 border-b border-border flex flex-wrap gap-2">
                  {m.attachments.map((a: any, idx: number) => (
                    <a
                      key={idx}
                      href={a.content || a.fileUrl || "#"}
                      download={a.name || a.filename || a.fileName || "attachment"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-[12px] hover:bg-secondary transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{a.name || a.filename || a.fileName || "Attachment"}</span>
                      {a.size && <span className="text-muted-foreground">({a.size})</span>}
                    </a>
                  ))}
                </div>
              )}
              {(!m.attachments || m.attachments.length === 0) && (
                <div className="border-b border-border mb-4"></div>
              )}
            </div>
          ))}

          <div className="pl-12 pt-4 pb-8">
            {!isReplying ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsReplying(true)} 
                  className="h-9 inline-flex items-center gap-2 rounded-full border border-border px-5 text-[13px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <Reply className="h-4 w-4" /> Reply
                </button>
                <button 
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (lastMsg) {
                      params.set("subject", `Fwd: ${thread.subject}`);
                      params.set("body", `<br/><br/><div style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">Forwarded message from ${lastMsg.from}:<br/>${lastMsg.body}</div>`);
                      params.set("threadId", thread.id);
                    }
                    router.push(`/mail/compose?${params.toString()}`);
                  }}
                  className="h-9 inline-flex items-center gap-2 rounded-full border border-border px-5 text-[13px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <Forward className="h-4 w-4" /> Forward
                </button>
              </div>
            ) : (
              <form 
                onSubmit={handleSubmit(submitReply)} 
                className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm focus-within:border-ring transition-colors"
              >
                <div className="bg-secondary/40 px-4 py-2.5 text-[12px] text-muted-foreground border-b border-border">
                  Reply to <span className="font-medium text-foreground">{replyToAddress || "Unknown"}</span>
                </div>
                <textarea
                  {...register("reply")}
                  autoFocus
                  placeholder="Type your message here..."
                  className="w-full resize-none bg-transparent p-4 text-[13.5px] outline-none min-h-[120px]"
                />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4">
                    {attachments.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-[12px]">
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{a.name}</span>
                        <span className="text-muted-foreground">{a.size}</span>
                        <button 
                          type="button"
                          onClick={() => setAttachments(p => p.filter((x) => x.id !== a.id))} 
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between bg-surface px-3 py-2.5 border-t border-border">
                  <div className="flex gap-1 text-muted-foreground">
                    <label className="grid h-8 w-8 cursor-pointer place-items-center rounded hover:bg-secondary transition-colors" aria-label="Attach file">
                      <Paperclip className="h-4 w-4" />
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          addFiles(e.target.files);
                          if (e.target.files?.[0]) toast.success(`Attached ${e.target.files[0].name}`);
                        }} 
                      />
                    </label>
                    <button type="button" className="grid h-8 w-8 place-items-center rounded hover:bg-secondary transition-colors">
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => { reset(); setAttachments([]); setIsReplying(false); }} 
                      className="h-8 px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={!replyValue?.trim()}
                      className="h-8 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
