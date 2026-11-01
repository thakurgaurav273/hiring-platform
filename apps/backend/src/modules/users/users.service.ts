import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import usersRepository from "./users.repository";
import { Prisma, Role } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { emailService } from "../email/email.service";

export const getAllUsers = async (query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    isActive?: string;
}) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const { search, role, isActive } = query;

    const where: Prisma.UserWhereInput = {};

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        usersRepository.findAllUsers({ skip, take: limit, where }),
        usersRepository.countUsers(where),
    ]);

    return {
        users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getUserById = async (id: string) => {
    const user = await usersRepository.findUserById(id);
    if (!user) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    return user;
};

export const updateUser = async (
    id: string,
    data: {
        firstName?: string;
        lastName?: string;
        title?: string;
        role?: Role;
        isActive?: boolean;
        department?: string;
        phone?: string;
        address?: string;
        avatarUrl?: string;
        notificationPreferences?: any;
    },
    actorId?: string
) => {
    const existingUser = await usersRepository.findUserById(id);
    if (!existingUser) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    // Safeguard: Prevent changing the role of the last admin
    if (data.role && data.role !== "administrator" && existingUser.role === "administrator") {
        const adminCount = await usersRepository.countActiveAdmins();
        if (adminCount <= 1) {
            throw new AppError("Cannot change the role of the last administrator", StatusCodes.BAD_REQUEST);
        }
    }

    const updated = await usersRepository.updateUser(id, data);

    if (actorId && data.role && data.role !== existingUser.role) {
        await usersRepository.logActivity({
            type: "USER_ROLE_CHANGED",
            actorId,
            entityType: "User",
            entityId: id,
            description: `Changed role from ${existingUser.role} to ${data.role}`,
            metadata: { oldRole: existingUser.role, newRole: data.role } as any,
        });
    }

    return updated;
};

export const deleteUser = async (id: string, actorId: string) => {
    if (id === actorId) {
        throw new AppError("You cannot deactivate your own account", StatusCodes.BAD_REQUEST);
    }

    const existingUser = await usersRepository.findUserById(id);
    if (!existingUser) {
        throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (existingUser.role === "administrator" && existingUser.isActive) {
        const adminCount = await usersRepository.countActiveAdmins();
        if (adminCount <= 1) {
            throw new AppError("Cannot deactivate the last administrator", StatusCodes.BAD_REQUEST);
        }
    }

    // Soft delete & revoke tokens
    await usersRepository.updateUser(id, { isActive: false });
    await usersRepository.revokeUserRefreshTokens(id);

    await usersRepository.logActivity({
        type: "USER_DEACTIVATED",
        actorId,
        entityType: "User",
        entityId: id,
        description: `Deactivated user ${existingUser.firstName} ${existingUser.lastName}`,
    });

    return;
};

export const inviteUser = async (
    inviterId: string,
    data: { email: string; role: Role }
) => {
    const existingUser = await usersRepository.findUserByEmail(data.email);
    if (existingUser) {
        throw new AppError("User with this email already exists", StatusCodes.CONFLICT);
    }

    const pendingInvite = await usersRepository.findInvitationByEmail(data.email);
    if (pendingInvite && pendingInvite.status === "PENDING" && pendingInvite.expiresAt > new Date()) {
        throw new AppError("An active invitation already exists for this email", StatusCodes.CONFLICT);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await usersRepository.createInvitation({
        email: data.email,
        role: data.role,
        token,
        expiresAt,
        status: "PENDING",
        invitedById: inviterId,
    });

    await emailService.sendInvitationEmail({
        to: invitation.email,
        token: invitation.token,
        role: invitation.role,
    });

    return invitation;
};

export const getInvitation = async (token: string) => {
    const invitation = await usersRepository.findInvitationByToken(token);
    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new AppError("Invalid or expired invitation token", StatusCodes.BAD_REQUEST);
    }
    return {
        email: invitation.email,
        role: invitation.role,
    };
};

export const acceptInvitation = async (
    token: string,
    data: { name: string; password: string }
) => {
    const invitation = await usersRepository.findInvitationByToken(token);
    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        throw new AppError("Invalid or expired invitation token", StatusCodes.BAD_REQUEST);
    }

    const parts = data.name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "";

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await usersRepository.createUser({
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: invitation.role as Role,
        invitedById: invitation.invitedById,
    });

    await usersRepository.updateInvitationStatus(invitation.id, "ACCEPTED");

    // Notify admins that a new user joined (fire-and-forget)
    const { notifyUserOnboarded } = await import("../notifications/notification.service");
    notifyUserOnboarded({
        newUserId: user.id,
        newUserName: `${firstName} ${lastName}`,
        newUserRole: invitation.role,
    }).catch(console.error);

    return user;
};

