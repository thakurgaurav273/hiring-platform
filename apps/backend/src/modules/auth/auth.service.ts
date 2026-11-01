import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authRepository from "./auth.repository";
import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import { jwtConfig } from "../../config/jwt.config";
import { emailService } from "../email/email.service";

export const login = async (data: {
    email: string;
    password: string;
}) => {
    const { email, password } = data;

    const user = await authRepository.findUserByEmail(email);

    if (!user) {
        throw new AppError(
            "Invalid email or password",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "Your account has been disabled",
            StatusCodes.FORBIDDEN
        );
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new AppError(
            "Invalid email or password",
            StatusCodes.UNAUTHORIZED
        );
    }

    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        jwtConfig.secret,
        {
            expiresIn: jwtConfig.expiresIn,
        }
    );

    const refreshToken = jwt.sign(
        {
            id: user.id,
        },
        jwtConfig.refreshSecret,
        {
            expiresIn: jwtConfig.refreshExpiresIn,
        }
    );

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await authRepository.createRefreshToken(
        user.id,
        refreshToken,
        expiresAt
    );

    return {
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
    };
};

export const logout = async (refreshToken: string) => {
    const storedToken = await authRepository.findRefreshToken(refreshToken);

    if (!storedToken) {
        throw new AppError(
            "Invalid refresh token",
            StatusCodes.UNAUTHORIZED
        );
    }


    await authRepository.deleteRefreshToken(refreshToken);

    return;
};

export const refreshToken = async (refreshToken: string) => {

    let decoded: { id: string };

    try {
        decoded = jwt.verify(
            refreshToken,
            jwtConfig.refreshSecret
        ) as { id: string };
    } catch {
        throw new AppError(
            "Invalid or expired refresh token",
            StatusCodes.UNAUTHORIZED
        );
    }


    const storedToken = await authRepository.findRefreshToken(refreshToken);

    if (!storedToken) {
        throw new AppError(
            "Refresh token not found",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (storedToken.revoked) {
        throw new AppError(
            "Refresh token has been revoked",
            StatusCodes.UNAUTHORIZED
        );
    }

    const user = await authRepository.findUserById(decoded.id);

    if (!user) {
        throw new AppError(
            "User not found",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "User account is deactivated",
            StatusCodes.UNAUTHORIZED
        );
    }

    const accessToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        jwtConfig.secret,
        {
            expiresIn: jwtConfig.expiresIn,
        }
    );

    return {
        accessToken,
    };
};
export const resetPassword = async (data: {
    token: string;
    password: string;
}) => {
    const { token, password } = data;

    let decoded: { id: string };

    try {
        decoded = jwt.verify(
            token,
            jwtConfig.secret
        ) as { id: string };
    } catch {
        throw new AppError(
            "Invalid or expired reset token",
            StatusCodes.UNAUTHORIZED
        );
    }

    const user = await authRepository.findUserById(decoded.id);

    if (!user) {
        throw new AppError(
            "User not found",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (!user.isActive) {
        throw new AppError(
            "User account is deactivated",
            StatusCodes.UNAUTHORIZED
        );
    }

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    await authRepository.updateUserPassword(
        user.id,
        hashedPassword
    );

    return;
};
export const forgotPassword = async (data: {
    email: string;
}) => {
    const { email } = data;

    const user = await authRepository.findUserByEmail(email);

    if (!user || !user.isActive) {
        return {
            message: "Password reset link has been sent to your email.",
        };
    }

    const resetToken = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        jwtConfig.secret,
        {
            expiresIn: "1d",
        }
    );

    const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    await authRepository.createPasswordResetToken(
        user.id,
        resetToken,
        expiresAt
    );

    await emailService.sendResetPasswordEmail({
        to: user.email,
        token: resetToken,
    });


    return {
        message: "Password reset link has been sent to your email.",
    };
};

export const changePassword = async (
    userId: string,
    data: {
        currentPassword: string;
        newPassword: string;
    }
) => {
    const { currentPassword, newPassword } = data;

    const user = await authRepository.findUserById(userId);

    if (!user) {
        throw new AppError(
            "User not found",
            StatusCodes.NOT_FOUND
        );
    }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordValid) {
        throw new AppError(
            "Old password is incorrect",
            StatusCodes.BAD_REQUEST
        );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    // Update password
    await authRepository.updatePassword(
        user.id,
        hashedPassword
    );

    return;
};

export const signup = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) => {
    const { email, password, firstName, lastName } = data;

    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
        throw new AppError(
            "User with this email already exists",
            StatusCodes.CONFLICT
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await authRepository.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
    });

    return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        isActive: newUser.isActive,
    };
};
