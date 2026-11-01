import { Role } from "@prisma/client";

export enum Permission {
    CREATE_JOB = "create:job",
    READ_JOB = "read:job",
    UPDATE_JOB = "update:job",
    DELETE_JOB = "delete:job",

    CREATE_CANDIDATE = "create:candidate",
    READ_CANDIDATE = "read:candidate",
    UPDATE_CANDIDATE = "update:candidate",
    DELETE_CANDIDATE = "delete:candidate",

    CREATE_NOTE = "create:note",
    READ_NOTE = "read:note",
    UPDATE_NOTE = "update:note",
    DELETE_NOTE = "delete:note",

    CREATE_FEEDBACK = "create:feedback",
    READ_FEEDBACK = "read:feedback",
    UPDATE_FEEDBACK = "update:feedback",
    DELETE_FEEDBACK = "delete:feedback",

    // Organization-level settings. Organization owners are always allowed,
    // regardless of role (see organization.service.ts#canManageBranding).
    MANAGE_BRANDING = "manage:branding",
}

export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
    administrator: Object.values(Permission),
    recruiter: Object.values(Permission).filter((p) => p !== Permission.MANAGE_BRANDING),
    hiring_manager: [
        Permission.READ_JOB,
        Permission.CREATE_JOB,
        Permission.UPDATE_JOB,
        // hiring managers cannot delete jobs (DELETE_JOB is omitted)
        Permission.CREATE_CANDIDATE,
        Permission.READ_CANDIDATE,
        Permission.UPDATE_CANDIDATE,
        Permission.CREATE_NOTE,
        Permission.READ_NOTE,
        Permission.UPDATE_NOTE,
        Permission.CREATE_FEEDBACK,
        Permission.READ_FEEDBACK,
        Permission.UPDATE_FEEDBACK,
    ],
    employee: [
        Permission.READ_JOB,
    ],
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
    if (role === "administrator") return true;
    const permissions = PERMISSION_MATRIX[role];
    return permissions ? permissions.includes(permission) : false;
};
