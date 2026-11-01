import { z } from "zod";

const EmailDirectionEnum = z.enum(["OUTBOUND", "INBOUND"]);
const EmailStatusEnum = z.enum(["QUEUED", "SENT", "DELIVERED", "FAILED", "REPLIED", "BOUNCED"]);

export const sendEmailSchema = z.object({
    body: z.object({
        candidateId: z.string().uuid("Invalid candidate ID").optional(),
        applicationId: z.string().uuid("Invalid application ID").optional(),
        to: z.string().email("Invalid recipient email"),
        cc: z.array(z.string().email()).optional().default([]),
        subject: z.string().min(1, "Subject is required"),
        body: z.string().min(1, "Body is required"),
        direction: EmailDirectionEnum.optional().default("OUTBOUND"),
        threadId: z.string().uuid().optional(),
    }),
});

export const getEmailByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid email ID"),
    }),
});

export const getEmailsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        candidateId: z.string().uuid().optional(),
        applicationId: z.string().uuid().optional(),
        threadId: z.string().uuid().optional(),
        direction: EmailDirectionEnum.optional(),
    }).optional(),
});

export const getEmailsByCandidateIdSchema = z.object({
    params: z.object({
        candidateId: z.string().uuid("Invalid candidate ID"),
    }),
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
    }).optional(),
});

export const getEmailsByThreadIdSchema = z.object({
    params: z.object({
        threadId: z.string().uuid("Invalid thread ID"),
    }),
});

export const getThreadsSchema = z.object({
    query: z.object({
        folder: z.enum(["inbox", "sent", "archive", "starred"]).optional().default("inbox"),
    }),
});

export const updateThreadSchema = z.object({
    params: z.object({
        threadId: z.string().uuid("Invalid thread ID"),
    }),
    body: z.object({
        isUnread: z.boolean().optional(),
        isStarred: z.boolean().optional(),
        isArchived: z.boolean().optional(),
    }),
});
