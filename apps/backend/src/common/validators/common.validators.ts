import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const searchSchema = z.object({
    search: z.string().trim().min(1).max(200).optional(),
});

export const isoDateSchema = z.string().datetime({ message: "Invalid ISO 8601 date" });

export const emailSchema = z.string().email("Invalid email address");

export const phoneSchema = z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    "Invalid phone number format"
);
