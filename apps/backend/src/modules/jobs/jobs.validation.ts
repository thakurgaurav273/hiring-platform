import { z } from "zod";


export const createJobSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, "Job title must be at least 3 characters"),

        department: z
            .string()
            .min(2, "Department is required"),

        location: z
            .string()
            .min(2, "Location is required"),

        employmentType: z.enum([
            "FULL_TIME",
            "PART_TIME",
            "CONTRACT",
            "INTERNSHIP",
        ]),

        experience: z
            .string()
            .optional(),

        skills: z
            .array(z.string())
            .optional(),

        openings: z.coerce
            .number()
            .int()
            .positive("Openings must be greater than 0")
            .optional()
            .default(1),

        applicationDeadline: z.coerce.date({
            required_error: "Application deadline is required",
            invalid_type_error: "Invalid deadline date format",
        }),

        status: z.enum([
            "DRAFT",
            "OPEN",
            "ON_HOLD",
            "CLOSED",
        ]).optional().default("DRAFT"),

        description: z
            .string()
            .min(20, "Description must be at least 20 characters"),

        salaryMin: z.coerce
            .number()
            .int()
            .nonnegative("Minimum salary must be non-negative")
            .optional(),

        salaryMax: z.coerce
            .number()
            .int()
            .nonnegative("Maximum salary must be non-negative")
            .optional(),
    }),
});


export const updateJobSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Job ID"),
    }),

    body: createJobSchema.shape.body.partial(),
});


export const getJobsSchema = z.object({
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

        search: z.string().optional(),

        department: z.string().optional(),

        status: z.enum([
            "DRAFT",
            "OPEN",
            "ON_HOLD",
            "CLOSED",
        ]).optional(),

        isReferral: z.coerce.boolean().optional(),
    }),
});


export const getJobByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Job ID"),
    }),
});


export const deleteJobSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Job ID"),
    }),
});