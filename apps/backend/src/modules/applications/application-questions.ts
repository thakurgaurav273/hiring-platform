import { z } from "zod";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../common/errors/app-error";

/**
 * Custom questions an organization can add to a job's application form.
 * Stored on Job.applicationQuestions; answers are stored on the Application.
 */
export const applicationQuestionSchema = z
    .object({
        id: z.string().trim().min(1).max(40).regex(/^[a-z0-9_-]+$/i, "Question ids may only contain letters, numbers, - and _"),
        label: z.string().trim().min(1).max(300),
        type: z.enum(["short_text", "long_text", "yes_no", "single_choice"]),
        options: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
        required: z.boolean().default(false),
    })
    .strict()
    .refine((q) => q.type !== "single_choice" || (q.options && q.options.length >= 2), {
        message: "Choice questions need at least two options",
        path: ["options"],
    });

export const applicationQuestionsSchema = z
    .array(applicationQuestionSchema)
    .max(20, "A job can have at most 20 questions")
    .refine((qs) => new Set(qs.map((q) => q.id)).size === qs.length, "Question ids must be unique");

export type ApplicationQuestion = z.infer<typeof applicationQuestionSchema>;

/** Reads questions stored on a job, ignoring anything malformed. */
export function parseStoredQuestions(value: unknown): ApplicationQuestion[] {
    const parsed = applicationQuestionsSchema.safeParse(value ?? []);
    return parsed.success ? parsed.data : [];
}

const MAX_ANSWER = { short_text: 300, long_text: 5000 } as const;

/**
 * Validates submitted answers against the job's questions. Unknown answers
 * are dropped; required questions must be answered.
 */
export function validateAnswers(
    questions: ApplicationQuestion[],
    raw: Record<string, unknown> | undefined
): { id: string; label: string; answer: string }[] {
    const answers = raw ?? {};
    const out: { id: string; label: string; answer: string }[] = [];
    const errors: string[] = [];

    for (const q of questions) {
        const value = answers[q.id];
        const text = typeof value === "string" ? value.trim() : typeof value === "boolean" ? (value ? "Yes" : "No") : "";

        if (!text) {
            if (q.required) errors.push(`"${q.label}" is required`);
            continue;
        }
        if (q.type === "yes_no" && !["Yes", "No", "yes", "no", "true", "false"].includes(text)) {
            errors.push(`"${q.label}" must be Yes or No`);
            continue;
        }
        if (q.type === "single_choice" && !q.options?.includes(text)) {
            errors.push(`"${q.label}" has an invalid choice`);
            continue;
        }
        if ((q.type === "short_text" || q.type === "long_text") && text.length > MAX_ANSWER[q.type]) {
            errors.push(`"${q.label}" is too long`);
            continue;
        }
        const normalized = q.type === "yes_no" ? (/^(yes|true)$/i.test(text) ? "Yes" : "No") : text;
        out.push({ id: q.id, label: q.label, answer: normalized });
    }

    if (errors.length) {
        throw new AppError(errors.join(". "), StatusCodes.BAD_REQUEST);
    }
    return out;
}
