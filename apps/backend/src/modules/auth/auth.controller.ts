import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { StatusCodes } from "http-status-codes";

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.login(req.body);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.logout(req.body);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Logout successful",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.refreshToken(req.body);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Access token refreshed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.forgotPassword(req.body);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Password reset link sent successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.resetPassword(req.body);

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Password reset successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await authService.changePassword(
            req.user!.id,
            req.body
        );

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Password changed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};



const authController = {
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
};

export default authController;