import { z } from "zod";

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => (v ? v : undefined));

const httpUrl = (max = 500) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => (v ? v : undefined))
        .refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), "Enter a full link starting with https://");

export const careersParamsSchema = z.object({
    params: z.object({ orgSlug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/) }),
});

export const careersJobParamsSchema = z.object({
    params: z.object({
        orgSlug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/),
        jobId: z.string().uuid(),
    }),
    query: z.object({ channel: z.enum(["careers", "embed"]).optional() }).optional(),
});

export const careersListQuerySchema = z.object({
    params: careersParamsSchema.shape.params,
    query: z
        .object({
            q: optionalText(100),
            department: optionalText(100),
            location: optionalText(100),
            employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]).optional(),
            // "embed" lists jobs published to the website embed instead of the careers page.
            channel: z.enum(["careers", "embed"]).optional(),
        })
        .optional(),
});

/**
 * Public application form. Multipart, so every value arrives as a string.
 * Unknown fields are ignored rather than rejected, because browsers and
 * embeds may add their own.
 */
export const applyBodySchema = z.object({
    fullName: z.string().trim().min(2, "Enter your full name").max(120),
    email: z.string().trim().email("Enter a valid email address").max(200),
    phone: optionalText(40).refine((v) => !v || /^[+()\-.\s\d]{6,40}$/.test(v), "Enter a valid phone number"),
    location: optionalText(120),
    linkedinUrl: httpUrl().refine((v) => !v || /linkedin\.com\//i.test(v), "Enter a LinkedIn profile link"),
    portfolioUrl: httpUrl(),
    coverLetter: optionalText(10_000),
    // JSON object of { questionId: answer }
    answers: z
        .string()
        .max(60_000)
        .optional()
        .transform((v, ctx) => {
            if (!v) return {} as Record<string, unknown>;
            try {
                const parsed = JSON.parse(v);
                if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
            } catch {
                /* handled below */
            }
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Answers are malformed" });
            return z.NEVER;
        }),
    consent: z.literal("true", { errorMap: () => ({ message: "Please accept the privacy notice to apply" }) }),
    consentVersion: optionalText(40),
    // Honeypot: hidden from people. If a bot fills it, the service accepts
    // the request with the normal response and stores nothing.
    website: z.string().max(500).optional(),
    // Attribution
    channel: z.enum(["careers", "embed"]).optional(),
    utm_source: optionalText(80),
    utm_medium: optionalText(80),
    utm_campaign: optionalText(120),
    utm_term: optionalText(120),
    utm_content: optionalText(120),
    referrerUrl: optionalText(500),
});

export type ApplyBody = z.infer<typeof applyBodySchema>;
