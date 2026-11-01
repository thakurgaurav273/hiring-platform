import { prisma } from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

// ─── Thread DTO helpers ───────────────────────────────────────────────────────

type ThreadWithMessages = Prisma.EmailThreadGetPayload<{
    include: { messages: { include: { fromUser: { select: { email: true; firstName: true; lastName: true } } } } };
}>;
type ThreadCandidate = { id: string; firstName: string; lastName: string; email: string };

/** Plain-text preview: emails may be HTML (templates, forwards). */
const toPreview = (body: string | undefined) =>
    (body ?? "")
        .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<br\s*\/?>(?!\n)/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 140);

/** Candidates for a set of threads (EmailThread has no relation to Candidate). */
const candidatesFor = async (threads: { candidateId: string | null }[]) => {
    const ids = [...new Set(threads.map((t) => t.candidateId).filter((id): id is string => !!id))];
    if (!ids.length) return new Map<string, ThreadCandidate>();
    const rows = await prisma.candidate.findMany({
        where: { id: { in: ids } },
        select: { id: true, firstName: true, lastName: true, email: true },
    });
    return new Map(rows.map((c) => [c.id, c]));
};

const toThreadDTO = (
    t: ThreadWithMessages,
    candidate: ThreadCandidate | undefined,
    state?: { isUnread: boolean; isStarred: boolean; isArchived: boolean }
) => {
    const lastMsg = t.messages[t.messages.length - 1];
    const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : undefined;
    return {
        id: t.id,
        candidateId: t.candidateId,
        candidate: candidate ? { id: candidate.id, name: candidateName!, email: candidate.email } : null,
        subject: t.subject,
        preview: toPreview(lastMsg?.body),
        lastMessageAt: (lastMsg?.createdAt ?? t.updatedAt).toISOString(),
        ...(state ? { unread: state.isUnread, starred: state.isStarred, archived: state.isArchived } : {}),
        messages: t.messages.map((m) => {
            // Inbound mail has no sending user; it comes from the thread's candidate.
            const inbound = m.direction === "INBOUND" && !m.fromUser;
            return {
                id: m.id,
                direction: m.direction,
                from: m.fromUser ? m.fromUser.email : inbound ? candidate?.email ?? "" : m.fromUserId || "",
                fromName: m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}`.trim() : inbound ? candidateName : undefined,
                to: m.to,
                at: m.createdAt.toISOString(),
                body: m.body,
                attachments: m.attachments,
            };
        }),
    };
};

const getUserThreads = async (userId: string, folder: string) => {
    // folder: "inbox" | "sent" | "archive" | "starred"
    let whereClause: Prisma.UserEmailThreadWhereInput = { userId };
    
    if (folder === "archive") {
        whereClause.isArchived = true;
    } else {
        whereClause.isArchived = false;
        
        if (folder === "starred") {
            whereClause.isStarred = true;
        } else if (folder === "inbox") {
            whereClause.thread = {
                messages: {
                    some: {
                        fromUserId: { not: userId }
                    }
                }
            };
        } else if (folder === "sent") {
            whereClause.thread = {
                messages: {
                    some: {
                        fromUserId: userId
                    }
                }
            };
        }
    }

    const userThreads = await prisma.userEmailThread.findMany({
        where: whereClause,
        include: {
            thread: {
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                        include: { fromUser: { select: { email: true, firstName: true, lastName: true } } }
                    }
                }
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    const candidates = await candidatesFor(userThreads.map((ut) => ut.thread));
    return userThreads.map((ut) => toThreadDTO(ut.thread, ut.thread.candidateId ? candidates.get(ut.thread.candidateId) : undefined, ut));
};

const getThreadById = async (userId: string, threadId: string) => {
    const ut = await prisma.userEmailThread.findUnique({
        where: { userId_threadId: { userId, threadId } },
        include: {
            thread: {
                include: {
                    messages: {
                        orderBy: { createdAt: "asc" },
                        include: { fromUser: { select: { email: true, firstName: true, lastName: true } } }
                    }
                }
            }
        }
    });

    if (!ut) return null;
    const candidates = await candidatesFor([ut.thread]);
    return toThreadDTO(ut.thread, ut.thread.candidateId ? candidates.get(ut.thread.candidateId) : undefined, ut);
};

const updateThreadState = async (userId: string, threadId: string, data: { isUnread?: boolean, isStarred?: boolean, isArchived?: boolean }) => {
    return prisma.userEmailThread.update({
        where: { userId_threadId: { userId, threadId } },
        data
    });
};

const deleteUserThread = async (userId: string, threadId: string) => {
    return prisma.userEmailThread.delete({
        where: { userId_threadId: { userId, threadId } }
    });
};

const getCounts = async (userId: string) => {
    const counts = await Promise.all([
        prisma.userEmailThread.count({ where: { userId, isArchived: false, thread: { messages: { some: { fromUserId: { not: userId } } } } } }), // inbox
        prisma.userEmailThread.count({ where: { userId, isStarred: true, isArchived: false } }), // starred
        prisma.userEmailThread.count({ where: { userId, isArchived: false, thread: { messages: { some: { fromUserId: userId } } } } }), // sent
        prisma.userEmailThread.count({ where: { userId, isArchived: true } }) // archive
    ]);
    
    return {
        inbox: counts[0],
        starred: counts[1],
        sent: counts[2], // Placeholder replaced
        drafts: 0,
        archive: counts[3]
    };
};

const findEmailById = async (id: string) => {
    return prisma.email.findUnique({
        where: { id },
    });
};

const updateEmailAttachments = async (id: string, attachments: any[]) => {
    return prisma.email.update({
        where: { id },
        data: { attachments },
    });
};

const updateEmailStatus = async (id: string, status: string) => {
    return prisma.email.update({
        where: { id },
        data: { status: status as any },
    });
};

const findAllEmails = async (params: { skip: number; take: number; where?: Prisma.EmailWhereInput; }) => {
    return prisma.email.findMany({ skip: params.skip, take: params.take, where: params.where, orderBy: { createdAt: "desc" } });
};

const countEmails = async (where?: Prisma.EmailWhereInput) => {
    return prisma.email.count({ where });
};

const findEmailsByThreadId = async (threadId: string) => {
    return prisma.email.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } });
};

const findEmailsByCandidateId = async (params: { candidateId: string; skip: number; take: number; }) => {
    return prisma.email.findMany({ where: { candidateId: params.candidateId }, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" } });
};

const countEmailsByCandidateId = async (candidateId: string) => {
    return prisma.email.count({ where: { candidateId } });
};

const getCandidateThreads = async (candidateId: string) => {
    const threads = await prisma.emailThread.findMany({
        where: { candidateId },
        include: {
            messages: {
                orderBy: { createdAt: "asc" },
                include: { fromUser: { select: { email: true, firstName: true, lastName: true } } }
            }
        },
        orderBy: { updatedAt: "desc" }
    });

    const candidates = await candidatesFor(threads);
    return threads.map((t) => toThreadDTO(t, t.candidateId ? candidates.get(t.candidateId) : undefined));
};

const emailRepository = {
    getUserThreads,
    getThreadById,
    updateThreadState,
    getCounts,
    findEmailById,
    updateEmailAttachments,
    updateEmailStatus,
    findAllEmails,
    countEmails,
    findEmailsByThreadId,
    findEmailsByCandidateId,
    countEmailsByCandidateId,
    getCandidateThreads,
    deleteUserThread
};

export default emailRepository;
