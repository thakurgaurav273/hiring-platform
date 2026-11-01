import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Invalid email address"),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Invalid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z
            .string()
            .min(1, "Reset token is required"),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z
            .string()
            .min(1, "Current password is required"),

        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password"),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z
            .string()
            .min(1, "Refresh token is required"),
    }),
});

export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z
            .string()
            .min(1, "Refresh token is required"),
    }),
});

export const signupSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email("Invalid email address"),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters"),

        firstName: z
            .string()
            .min(1, "First name is required"),

        lastName: z
            .string()
            .min(1, "Last name is required"),
    }),
});
