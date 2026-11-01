import prisma from "../../database/prisma-client";
import { Prisma } from "@prisma/client";

const findAllUsers = async (params: {
    skip: number;
    take: number;
    where?: Prisma.UserWhereInput;
}) => {
    const { skip, take, where } = params;
    return prisma.user.findMany({
        skip,
        take,
        where,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            organizationId: true,
            avatarUrl: true,
            department: true,
            title: true,
            phone: true,
            address: true,
            notificationPreferences: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

const countUsers = async (where?: Prisma.UserWhereInput) => {
    return prisma.user.count({ where });
};

const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            organizationId: true,
            avatarUrl: true,
            department: true,
            title: true,
            phone: true,
            address: true,
            notificationPreferences: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email },
    });
};

const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
    return prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            avatarUrl: true,
            department: true,
            title: true,
            phone: true,
            address: true,
            notificationPreferences: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

const deleteUser = async (id: string) => {
    return prisma.user.delete({ where: { id } });
};

const createInvitation = async (data: any) => {
    return (prisma as any).userInvitation.create({ data });
};

const findInvitationByToken = async (token: string) => {
    return (prisma as any).userInvitation.findUnique({ where: { token } });
};

const findInvitationByEmail = async (email: string) => {
    return (prisma as any).userInvitation.findUnique({ where: { email } });
};

const updateInvitationStatus = async (id: string, status: "PENDING" | "ACCEPTED" | "REVOKED") => {
    return (prisma as any).userInvitation.update({ where: { id }, data: { status } });
};

const createUser = async (data: Prisma.UserUncheckedCreateInput) => {
    return prisma.user.create({ data });
};

const countActiveAdmins = async (organizationId: string) => {
    return prisma.user.count({
        where: { organizationId, role: "administrator", isActive: true },
    });
};

const createDefaultPreference = async (userId: string) => {
    return prisma.userPreference.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
};

const revokeUserRefreshTokens = async (userId: string) => {
    return prisma.refreshToken.deleteMany({
        where: { userId },
    });
};

const logActivity = async (data: Prisma.ActivityLogUncheckedCreateInput) => {
    return prisma.activityLog.create({ data });
};

const usersRepository = {
    findAllUsers,
    countUsers,
    findUserById,
    findUserByEmail,
    updateUser,
    deleteUser,
    createInvitation,
    findInvitationByToken,
    findInvitationByEmail,
    updateInvitationStatus,
    createUser,
    countActiveAdmins,
    createDefaultPreference,
    revokeUserRefreshTokens,
    logActivity,
};

export default usersRepository;
