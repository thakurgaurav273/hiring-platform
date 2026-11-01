import { z } from "zod";

const RoleEnum = z.enum([
    "administrator",
    "recruiter",
    "hiring_manager",
    "employee",
]);

export const getUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().optional(),
        role: RoleEnum.optional(),
        isActive: z.enum(["true", "false"]).optional(),
    }).optional(),
});

export const getUserByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid user ID format"),
    }),
});

export const updateMeSchema = z.object({
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        title: z.string().optional(),
        department: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        avatarUrl: z.string().url().optional().nullable(),
        // Per-user switches for in-app and push notifications. Missing = on.
        notificationPreferences: z
            .object({
                newApplications: z.boolean().optional(),
                stageChanges: z.boolean().optional(),
                interviewReminders: z.boolean().optional(),
            })
            .strict()
            .optional(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid user ID format"),
    }),
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        role: RoleEnum.optional(),
        isActive: z.boolean().optional(),
        department: z.string().optional(),
        avatarUrl: z.string().url().optional().nullable(),
    }),
});

export const deleteUserSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid user ID format"),
    }),
});

export const inviteUserSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        role: RoleEnum,
    }),
});

export const acceptInvitationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Full name is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
    }),
});
