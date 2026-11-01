import { z } from "zod";

const PipelineStageEnum = z.enum([
    "APPLIED",
    "SCREENING",
    "SHORTLISTED",
    "ASSESSMENT_SENT",
    "ASSESSMENT_SUBMITTED",
    "INTERVIEW_SCHEDULED",
    "TECHNICAL_INTERVIEW",
    "HR_INTERVIEW",
    "OFFER_EXTENDED",
    "OFFER_ACCEPTED",
    "JOINED",
    "REJECTED",
]);

const StageDefinitionSchema = z.object({
    stage: PipelineStageEnum,
    order: z.number().int().nonnegative(),
    label: z.string().optional(),
});

export const createTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Template name must be at least 2 characters"),
        jobId: z.string().uuid("Invalid Job ID format").optional(),
        isDefault: z.boolean().optional().default(false),
        stages: z.array(StageDefinitionSchema).min(1, "At least one stage definition is required"),
    }),
});

export const updateTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Template name must be at least 2 characters").optional(),
        jobId: z.string().uuid("Invalid Job ID format").optional(),
        isDefault: z.boolean().optional(),
        stages: z.array(StageDefinitionSchema).min(1).optional(),
    }),
});

export const getTemplateByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid template ID format"),
    }),
});

export const getTemplateByJobIdSchema = z.object({
    params: z.object({
        jobId: z.string().uuid("Invalid job ID format"),
    }),
});

export const getHistoryByApplicationIdSchema = z.object({
    params: z.object({
        applicationId: z.string().uuid("Invalid application ID format"),
    }),
});
