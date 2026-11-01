import { prisma } from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

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

    return userThreads.map(ut => {
        const t = ut.thread;
        const lastMsg = t.messages[t.messages.length - 1];
        return {
            id: t.id,
            candidateId: t.candidateId,
            subject: t.subject,
            preview: lastMsg?.body?.substring(0, 100) || "",
            unread: ut.isUnread,
            starred: ut.isStarred,
            archived: ut.isArchived,
            messages: t.messages.map(m => ({
                id: m.id,
                from: m.fromUser ? m.fromUser.email : (m.fromUserId || ""),
                fromName: m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}`.trim() : undefined,
                to: m.to,
                at: m.createdAt.toISOString(),
                body: m.body,
                attachments: m.attachments,
            }))
        };
    });
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

    const t = ut.thread;
    const lastMsg = t.messages[t.messages.length - 1];
    return {
        id: t.id,
        candidateId: t.candidateId,
        subject: t.subject,
        preview: lastMsg?.body?.substring(0, 100) || "",
        unread: ut.isUnread,
        starred: ut.isStarred,
        archived: ut.isArchived,
        messages: t.messages.map(m => ({
            id: m.id,
            from: m.fromUser ? m.fromUser.email : (m.fromUserId || ""),
            fromName: m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}`.trim() : undefined,
            to: m.to,
            at: m.createdAt.toISOString(),
            body: m.body,
            attachments: m.attachments,
        }))
    };
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

    return threads.map(t => {
        const lastMsg = t.messages[t.messages.length - 1];
        return {
            id: t.id,
            candidateId: t.candidateId,
            subject: t.subject,
            preview: lastMsg?.body?.substring(0, 100) || "",
            messages: t.messages.map(m => ({
                id: m.id,
                from: m.fromUser ? m.fromUser.email : (m.fromUserId || ""),
                fromName: m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}`.trim() : undefined,
                to: m.to,
                at: m.createdAt.toISOString(),
                body: m.body,
                attachments: m.attachments,
            }))
        };
    });
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
