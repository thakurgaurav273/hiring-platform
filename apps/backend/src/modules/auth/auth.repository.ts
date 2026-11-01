import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma-client";

const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: {
            email,
        },
    });
};

const findUserById = async (id: string) => {
    return prisma.user.findUnique({
        where: {
            id,
        },
    });
};

const createRefreshToken = async (
    userId: string,
    token: string,
    expiresAt: Date
) => {
    return prisma.refreshToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
};

const findRefreshToken = async (token: string) => {
    return prisma.refreshToken.findUnique({
        where: {
            token,
        },
    });
};

const deleteRefreshToken = async (token: string) => {
    return prisma.refreshToken.delete({
        where: {
            token,
        },
    });
};

const createPasswordResetToken = async (
    userId: string,
    token: string,
    expiresAt: Date
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return prisma.passwordResetToken.create({
        data: {
            email: user.email,
            token,
            expiresAt,
        },
    });
};

const findPasswordResetToken = async (token: string) => {
    return prisma.passwordResetToken.findUnique({
        where: {
            token,
        },
    });
};

const markPasswordResetTokenUsed = async (token: string) => {
    return prisma.passwordResetToken.update({
        where: {
            token,
        },
        data: {
            used: true,
        },
    });
};

const updatePassword = async (
    userId: string,
    password: string
) => {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password,
        },
    });
};

const createUser = async (data: Prisma.UserCreateInput) => {
    return prisma.user.create({
        data,
    });
};

const authRepository = {
    findUserByEmail,
    findUserById,
    createUser,
    createRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    createPasswordResetToken,
    findPasswordResetToken,
    markPasswordResetTokenUsed,
    updatePassword,
    updateUserPassword: updatePassword,
};

export default authRepository;