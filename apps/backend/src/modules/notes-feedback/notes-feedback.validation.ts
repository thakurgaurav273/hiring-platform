import { z } from "zod";

export const createNoteSchema = z.object({
    body: z.object({
        candidateId: z.string().uuid("Invalid Candidate ID"),
        applicationId: z.string().uuid("Invalid Application ID").optional(),
        type: z.enum(["PRIVATE", "GENERAL"]).optional().default("GENERAL"),
        content: z.string().min(1, "Content is required"),
    }),
});

export const updateNoteSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Note ID"),
    }),
    body: z.object({
        type: z.enum(["PRIVATE", "GENERAL"]).optional(),
        content: z.string().min(1, "Content is required").optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    }),
});

export const getNotesSchema = z.object({
    query: z.object({
        candidateId: z.string().uuid("Invalid Candidate ID").optional(),
        applicationId: z.string().uuid("Invalid Application ID").optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
});

export const getNoteByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Note ID"),
    }),
});

export const deleteNoteSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Note ID"),
    }),
});

export const createFeedbackSchema = z.object({
    body: z.object({
        applicationId: z.string().uuid("Invalid Application ID"),
        interviewId: z.string().uuid("Invalid Interview ID").optional(),
        type: z.enum(["TECHNICAL", "HR"]),
        rating: z.number().int().min(1).max(5),
        recommendation: z.enum(["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"]),
        comments: z.string().optional(),
    }),
});

export const updateFeedbackSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Feedback ID"),
    }),
    body: z.object({
        type: z.enum(["TECHNICAL", "HR"]).optional(),
        rating: z.number().int().min(1).max(5).optional(),
        recommendation: z.enum(["STRONG_YES", "YES", "NEUTRAL", "NO", "STRONG_NO"]).optional(),
        comments: z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    }),
});

export const getFeedbacksSchema = z.object({
    query: z.object({
        applicationId: z.string().uuid("Invalid Application ID").optional(),
        interviewId: z.string().uuid("Invalid Interview ID").optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
});

export const getFeedbackByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Feedback ID"),
    }),
});

export const deleteFeedbackSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Feedback ID"),
    }),
});
