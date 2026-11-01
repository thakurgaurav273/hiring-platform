import { z } from "zod";

const PipelineStageEnum = z.enum([
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "TECHNICAL_ROUND",
    "HR_ROUND",
    "OFFER_SENT",
    "HIRED",
    "REJECTED",
]);

export const createCandidateSchema = z.object({
    body: z.object({
        firstName: z
            .string()
            .min(2, "First name must be at least 2 characters"),

        lastName: z
            .string()
            .optional()
            .or(z.literal("")),

        email: z
            .string()
            .email("Invalid email address"),

        phone: z
            .string()
            .optional()
            .or(z.literal("")),

        location: z
            .string()
            .optional()
            .or(z.literal("")),

        experience: z.preprocess((val) => {
            if (typeof val === "string") {
                try { return JSON.parse(val); } catch { return val; }
            }
            return val;
        }, z.any().optional()),

        skills: z.preprocess((val) => {
            if (typeof val === "string") {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    return val.split(",").map(s => s.trim()).filter(Boolean);
                }
            }
            return val;
        }, z.array(z.string()).optional()),

        jobId: z
            .string()
            .uuid("Invalid Job ID"),

        stage: PipelineStageEnum.default("APPLIED"),

        resumeUrl: z
            .string()
            .url()
            .optional(),
            
        education: z
            .string()
            .optional(),
            
        portfolio: z
            .string()
            .optional(),
            
        summary: z
            .string()
            .optional(),
            
        referredBy: z
            .string()
            .optional(),

        whySuggest: z
            .string()
            .optional(),
    }),
});

export const updateCandidateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Candidate ID"),
    }),

    body: createCandidateSchema.shape.body.partial(),
});

export const getCandidatesSchema = z.object({
    query: z.object({
        page: z.coerce
            .number()
            .int()
            .positive()
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .positive()
            .max(100)
            .default(10),

        search: z
            .string()
            .optional(),

        department: z
            .union([z.string(), z.array(z.string())])
            .optional(),

        stage: z
            .union([PipelineStageEnum, z.array(PipelineStageEnum)])
            .optional(),

        jobId: z
            .union([z.string().uuid(), z.array(z.string().uuid())])
            .optional(),
            
        referredBy: z
            .string()
            .optional(),
    }),
});

export const getCandidateByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Candidate ID"),
    }),
});

export const updateCandidateStageSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Candidate ID"),
    }),

    body: z.object({
        stage: PipelineStageEnum,
    }),
});

export const deleteCandidateSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Candidate ID"),
    }),
});