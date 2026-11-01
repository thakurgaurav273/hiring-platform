"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Guard } from "@/components/access-restricted";
import {
  X, Paperclip, Image as ImageIcon,
  Bold, Italic, Underline, List, Link2, Send, Trash2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";
import { useAppStore } from "@/store/app.store";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { composeMailSchema, type ComposeMailFormValues } from "@/lib/schemas/mail.schema";
import { useSendEmail } from "@/hooks/useMail";

type Attachment = { id: string; name: string; size: string; content?: string; mimeType?: string };

export default function ComposeMailPage() {
  return (
    <Guard section="mail">
      <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading...</div>}>
        <ComposeMailInner />
      </Suspense>
    </Guard>
  );
}

function ComposeMailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppStore((s) => s.user)();
  const defaultTo = searchParams.get("to") || "";
  const defaultSubject = searchParams.get("subject") || "";
  const candidateId = searchParams.get("candidateId") || undefined;
  const threadId = searchParams.get("threadId") || undefined;

  const [ui, setUi] = useState({
    showCc: false,
    showBcc: false,
    dragOver: false,
    savedAt: null as string | null,
    attachments: [] as Attachment[],
  });
  const editorRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ComposeMailFormValues>({
    resolver: zodResolver(composeMailSchema),
    defaultValues: {
      from: searchParams.get("from") || user.email,
      to: defaultTo,
      subject: defaultSubject,
      cc: "",
      bcc: "",
      body: searchParams.get("body") || "",
    },
  });

  const sendEmail = useSendEmail();

  const formValues = watch();

  // Load initial search params on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      if (searchParams.get("body")) {
        editorRef.current.innerHTML = searchParams.get("body") || "";
      }
    }
  }, [searchParams, setValue]);

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
    setUi(p => ({ ...p, attachments: [...p.attachments, ...items] }));
  };

  const send: SubmitHandler<ComposeMailFormValues> = (data) => {
    const formattedAttachments = ui.attachments.map(a => ({
      filename: a.name,
      content: a.content?.split(',')[1] || "", // extract base64 data
      contentType: a.mimeType || "application/octet-stream"
    })).filter(a => a.content);

    sendEmail.mutate({
      to: data.to,
      cc: data.cc ? data.cc.split(",").map((s) => s.trim()) : undefined,
      subject: data.subject,
      body: data.body || "",
      candidateId,
      threadId,
      attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined,
    }, {
      onSuccess: () => {
        localStorage.removeItem("mail-draft");
        toast.success("Message sent");
        router.back();
      }
    });
  };

  const discard = () => {
    localStorage.removeItem("mail-draft");
    toast("Draft discarded");
    router.back();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6">
        <BackButton fallback="/mail" />
        <div>
          <div className="text-[14px] font-semibold">Compose Mail</div>
          <div className="text-[11.5px] text-muted-foreground">Send a new message</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface-2/30 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-secondary/50 px-4">
            <div className="text-[13px] font-semibold">New message</div>
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <button onClick={discard} className="grid h-7 w-7 place-items-center rounded-md hover:bg-secondary hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Recipients */}
          <form id="compose-form" onSubmit={handleSubmit(send)} className="shrink-0 border-b border-border px-5 pt-2">
            <FieldRow label="From">
              <input {...register("from")} readOnly className="h-9 flex-1 bg-transparent text-[13px] outline-none text-muted-foreground" />
            </FieldRow>
            <FieldRow label="To">
              <input {...register("to")} placeholder="name@company.com" className="h-9 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                {!ui.showCc && <button type="button" onClick={() => setUi(p => ({ ...p, showCc: true }))} className="hover:text-foreground">Cc</button>}
                {!ui.showBcc && <button type="button" onClick={() => setUi(p => ({ ...p, showBcc: true }))} className="hover:text-foreground">Bcc</button>}
              </div>
            </FieldRow>
            {errors.to && <div className="px-14 pb-2 text-[11px] text-destructive">{errors.to.message}</div>}
            
            {ui.showCc && (
              <FieldRow label="Cc">
                <input {...register("cc")} className="h-9 flex-1 bg-transparent text-[13px] outline-none" />
              </FieldRow>
            )}
            {ui.showBcc && (
              <FieldRow label="Bcc">
                <input {...register("bcc")} className="h-9 flex-1 bg-transparent text-[13px] outline-none" />
              </FieldRow>
            )}
            <FieldRow label="Subject">
              <input {...register("subject")} placeholder="Add a subject" className="h-9 flex-1 bg-transparent text-[13.5px] font-medium outline-none placeholder:text-muted-foreground" />
            </FieldRow>
            {errors.subject && <div className="px-14 pb-2 text-[11px] text-destructive">{errors.subject.message}</div>}
          </form>

          {/* Body */}
          <div 
            className="relative flex-1 min-h-[250px] overflow-y-auto px-5 py-4"
            onDragOver={(e) => { e.preventDefault(); setUi(p => ({ ...p, dragOver: true })); }}
            onDragLeave={() => setUi(p => ({ ...p, dragOver: false }))}
            onDrop={(e) => { e.preventDefault(); setUi(p => ({ ...p, dragOver: false })); addFiles(e.dataTransfer.files); }}
          >
            {ui.dragOver && (
              <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-primary/5 text-[13px] font-medium text-primary">
                Drop files to attach
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setValue("body", (e.target as HTMLDivElement).innerHTML)}
              className="min-h-[160px] text-[14px] leading-[1.65] outline-none"
              data-placeholder="Write your message…"
            />
            {(formValues.body || "").replace(/<[^>]*>?/gm, '').trim().length === 0 && (
              <div className="pointer-events-none -mt-[160px] text-[14px] leading-[1.65] text-muted-foreground">Write your message…</div>
            )}

            {ui.attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {ui.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-[12px]">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground">{a.size}</span>
                    <button onClick={() => setUi(p => ({ ...p, attachments: p.attachments.filter((x) => x.id !== a.id) }))} className="ml-1 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toolbar + Send */}
          <div className="shrink-0 border-t border-border mt-auto">
            <div className="flex items-center gap-1 px-4 py-2 text-muted-foreground bg-secondary/20 border-b border-border">
              <ToolbarBtn icon={Bold} label="Bold" onClick={() => document.execCommand("bold")} />
              <ToolbarBtn icon={Italic} label="Italic" onClick={() => document.execCommand("italic")} />
              <ToolbarBtn icon={Underline} label="Underline" onClick={() => document.execCommand("underline")} />
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarBtn icon={List} label="List" onClick={() => document.execCommand("insertUnorderedList")} />
              <ToolbarBtn icon={Link2} label="Link" onClick={() => {
                const url = prompt("Enter link URL:");
                if (url) document.execCommand("createLink", false, url);
              }} />
              <div className="mx-1 h-5 w-px bg-border" />
              <label className="grid h-8 w-8 cursor-pointer place-items-center rounded-md hover:bg-secondary hover:text-foreground" title="Attach file">
                <Paperclip className="h-4 w-4" />
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
              <label className="grid h-8 w-8 cursor-pointer place-items-center rounded-md hover:bg-secondary hover:text-foreground" title="Insert image">
                <ImageIcon className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-surface">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  form="compose-form"
                  disabled={sendEmail.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary pl-4 pr-3 text-[13px] font-medium text-primary-foreground shadow-sm transition hover:bg-[color:var(--color-primary-hover)] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Send
                  <span className="ml-1 grid h-6 w-6 place-items-center rounded-md bg-black/10">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </button>
                <span className="text-[11.5px] text-muted-foreground">
                  {ui.savedAt ? `Draft saved · ${ui.savedAt}` : "Drafting…"}
                </span>
              </div>
              <button onClick={discard} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" title="Discard draft">
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/70 last:border-b-0">
      <span className="w-14 shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary hover:text-foreground"
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
