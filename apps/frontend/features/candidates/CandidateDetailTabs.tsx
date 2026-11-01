"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Calendar, FileText, Download, Eye, Sparkles, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { Tag } from "@/components/stage-badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate } from "@/lib/types";
import { useForm } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";
import { CandidateOverviewTab } from "./CandidateOverviewTab";

import { useCandidateResumes } from "@/hooks/useResumes";
import { useCandidateNotes, useCreateNote } from "@/hooks/useNotes";
import { useCandidateTimeline } from "@/hooks/useCandidates";
import { useAppStore } from "@/store/app.store";
import { ROLE_KEYS } from "@/constants/roles.constants";

interface CandidateDetailTabsProps {
  live: any;
  events?: any[];
  threads: any[];
  interviews: any[];
  onSendEmailClick: () => void;
  router: any;
}

export function CandidateDetailTabs({
  live,
  events,
  threads,
  interviews,
  onSendEmailClick,
  router,
}: CandidateDetailTabsProps) {
  const { data: resumes, isLoading: isLoadingResumes } = useCandidateResumes(live.id);
  const { data: notes, isLoading: isLoadingNotes } = useCandidateNotes(live.id);
  const { data: timelineResponse, isLoading: isLoadingTimeline } = useCandidateTimeline(live.id);
  const createNote = useCreateNote();
  const { authUser: user } = useAppStore();
  const [selectedThread, setSelectedThread] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { note: "", opinion: "Neutral" }
  });

  const onSubmit = (data: { note: string; opinion: string }) => {
    if (!data.note.trim()) return;
    createNote.mutate({ candidateId: live.id, content: data.note, opinion: data.opinion }, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const upcomingInterviews = interviews.filter((i: any) => i.status === "SCHEDULED").sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const completedInterviews = interviews.filter((i: any) => i.status === "COMPLETED").sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const canEdit = user?.role === ROLE_KEYS.ADMINISTRATOR || (user?.role === ROLE_KEYS.HIRING_MANAGER && user?.department === live?.applications?.[0]?.job?.department);

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="mail">Mail</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="interviews">Interviews</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <CandidateOverviewTab live={live} />
      </TabsContent>

      <TabsContent value="timeline" className="mt-5">
        <div className="surface-card p-5">
          <div className="relative pl-6">
            <div className="absolute left-[10px] top-1 bottom-1 w-px bg-border" />
            {isLoadingTimeline ? (
              <div className="text-[13px] text-muted-foreground">Loading timeline...</div>
            ) : timelineResponse && timelineResponse.data && timelineResponse.data.length > 0 ? (
              timelineResponse.data.map((log: any) => (
                <EventItem key={log.id} event={log} />
              ))
            ) : (
              <div className="text-[13px] text-muted-foreground">No timeline events available.</div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="mail" className="mt-5">
        <div className="surface-card divide-y divide-border">
          {selectedThread ? (
            <div className="p-4 flex flex-col">
              <button 
                onClick={() => setSelectedThread(null)}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground self-start mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> Back to threads
              </button>
              <h3 className="text-[14px] font-semibold mb-4">{selectedThread.subject}</h3>
              <div className="space-y-4">
                {selectedThread.messages.map((msg: any) => (
                  <div key={msg.id} className="rounded-lg border border-border p-4 bg-surface/50">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-[13px]">
                        <span className="font-semibold">{msg.fromName || msg.from}</span>
                        {msg.fromName && <span className="text-muted-foreground ml-1">&lt;{msg.from}&gt;</span>}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{new Date(msg.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[13px] text-foreground whitespace-pre-wrap mt-2">{msg.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {threads.length === 0 && (
                <div className="p-8 text-center text-[13px] text-muted-foreground">
                  No emails yet. <button onClick={onSendEmailClick} className="text-foreground underline">Send one</button>.
                </div>
              )}
              {threads.map((t) => (
                <ThreadItem key={t.id} thread={t} onClick={() => setSelectedThread(t)} />
              ))}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="notes" className="mt-5 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="surface-card p-4">
          <textarea
            {...register("note")}
            rows={3}
            placeholder="Add a note. Use @ to mention teammates…"
            className="w-full resize-none bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex items-center gap-2">
            <label className="text-[12px] font-medium text-muted-foreground shrink-0">Opinion</label>
            <select
              {...register("opinion")}
              className="h-8 flex-1 rounded-md border border-border bg-surface px-2.5 text-[12.5px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {["Highly Recommend", "Recommend", "Neutral", "Average", "Below Average"].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex items-center justify-end border-t border-border pt-2">
            <button
              type="submit"
              disabled={createNote.isPending}
              className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createNote.isPending ? "Posting..." : "Post note"}
            </button>
          </div>
        </form>
        <div className="surface-card divide-y divide-border">
          {isLoadingNotes ? (
            <div className="p-8 text-center text-[13px] text-muted-foreground">Loading notes...</div>
          ) : notes && notes.length > 0 ? (
            notes.map((n: any, i: number) => (
              <NoteItem key={n.id || i} note={n} />
            ))
          ) : (
            <div className="p-8 text-center text-[13px] text-muted-foreground">No notes yet.</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="interviews" className="mt-5">
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Upcoming</div>
            <div className="surface-card divide-y divide-border">
              {upcomingInterviews.length === 0 && <div className="p-8 text-center text-[13px] text-muted-foreground">No upcoming interviews.</div>}
              {upcomingInterviews.map((i) => (
                <InterviewItem key={i.id} interview={i} showEdit={canEdit} candidateId={live.id} />
              ))}
              <Link href={`/candidates/${live.id}/schedule`} className="flex w-full items-center gap-2 p-4 text-[13px] font-medium text-muted-foreground hover:bg-secondary/40">
                <Calendar className="h-4 w-4" /> Schedule interview
              </Link>
            </div>
          </div>
          <div>
            <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Completed</div>
            <div className="surface-card divide-y divide-border">
              {completedInterviews.length === 0 && <div className="p-8 text-center text-[13px] text-muted-foreground">No completed interviews.</div>}
              {completedInterviews.map((i) => (
                <InterviewItem key={i.id} interview={i} showEdit={false} candidateId={live.id} />
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="attachments" className="mt-5">
        <div className="surface-card divide-y divide-border">
          {isLoadingResumes ? (
            <div className="p-8 text-center text-[13px] text-muted-foreground">Loading attachments...</div>
          ) : resumes && resumes.data && resumes.data.length > 0 ? (
            resumes.data.map((f: any) => (
              <AttachmentItem key={f.id} file={{ name: f.fileName, size: `${(f.fileSize / 1024).toFixed(0)} KB`, url: f.downloadUrl }} />
            ))
          ) : (
            <div className="p-8 text-center text-[13px] text-muted-foreground">No attachments uploaded</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// Sub-components

function EventItem({ event }: { event: any }) {
  let relativeTime = "Just now";
  try {
    if (event.createdAt) {
      relativeTime = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });
    }
  } catch (e) {}

  const actorName = event.actor ? `${event.actor.firstName} ${event.actor.lastName}` : "System";
  
  let title = event.type.replace(/_/g, ' ');
  if (event.type === 'CANDIDATE_CREATED') title = 'Candidate Added';
  else if (event.type === 'CANDIDATE_MOVED') title = 'Stage Updated';
  else if (event.type === 'NOTE_ADDED') title = 'Note Added';
  else if (event.type === 'INTERVIEW_SCHEDULED') title = 'Interview Scheduled';
  else if (event.type === 'INTERVIEW_UPDATED') title = 'Interview Updated';

  return (
    <div className="relative mb-5 last:mb-0">
      <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-surface" />
      <div className="text-[12.5px]">
        <span className="font-medium">{title}</span> <span className="text-muted-foreground">· {relativeTime}</span>
      </div>
      <div className="mt-1 text-[12px] text-muted-foreground">
        {event.description} <span className="opacity-70">(by {actorName})</span>
      </div>
    </div>
  );
}

function ThreadItem({ thread, onClick }: { thread: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-3 p-4 text-left hover:bg-secondary/40">
      <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{thread.subject}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{thread.preview}</div>
      </div>
      <div className="shrink-0 text-[11px] text-muted-foreground">{thread.messages[thread.messages.length - 1].at}</div>
    </button>
  );
}

function NoteItem({ note }: { note: any }) {
  const opinionColors: Record<string, string> = {
    "Highly Recommend": "bg-[oklch(0.92_0.06_155)] text-[oklch(0.3_0.1_155)]",
    Recommend: "bg-[oklch(0.93_0.05_240)] text-[oklch(0.35_0.1_240)]",
    Neutral: "bg-secondary text-muted-foreground",
    Average: "bg-[oklch(0.94_0.07_75)] text-[oklch(0.4_0.1_75)]",
    "Below Average": "bg-[oklch(0.94_0.04_25)] text-[oklch(0.4_0.08_25)]",
  };
  
  const authorName = note.author ? `${note.author.firstName} ${note.author.lastName}` : "Unknown";
  let relativeTime = "Just now";
  try {
    if (note.createdAt) {
      relativeTime = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
    }
  } catch (e) {}
  
  return (
    <div className="flex items-start gap-3 p-4">
      <Avatar name={authorName} seed={authorName} size={28} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-medium">{authorName}</span>
          <span className="text-[11.5px] text-muted-foreground">· {relativeTime}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
              opinionColors[note.opinion] ?? opinionColors["Neutral"]
            }`}
          >
            {note.opinion || "Neutral"}
          </span>
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground whitespace-pre-wrap">{note.content}</div>
      </div>
    </div>
  );
}

function InterviewItem({ interview, showEdit, candidateId }: { interview: any; showEdit: boolean; candidateId: string }) {
  const dateObj = new Date(interview.scheduledAt);
  const dateString = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeString = dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  const interviewerNames = interview.panelists?.map((p: any) => `${p.interviewer?.firstName} ${p.interviewer?.lastName}`).join(", ") || "Unknown";

  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-accent/12 text-accent">
        <Calendar className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium capitalize flex items-center gap-2">
          {interview.type.toLowerCase()} · {interviewerNames}
        </div>
        <div className="text-[11.5px] text-muted-foreground flex items-center gap-2">
          {dateString} · {timeString} · {interview.durationMins}m · {interview.location}
          {showEdit && (
            <Link href={`/candidates/${candidateId}/interviews/${interview.id}/edit`} className="ml-2 hover:text-foreground inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Edit
            </Link>
          )}
        </div>
      </div>
      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium capitalize">{interview.status.toLowerCase()}</span>
    </div>
  );
}

function AttachmentItem({ file }: { file: { name: string; size: string; url?: string } }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-muted-foreground">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{file.name}</div>
        <div className="text-[11.5px] text-muted-foreground">{file.size}</div>
      </div>
      {file.url && (
        <div className="flex items-center gap-1">
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="View attachment"
          >
            <Eye className="h-4 w-4" />
          </a>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            download
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="Download attachment"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
