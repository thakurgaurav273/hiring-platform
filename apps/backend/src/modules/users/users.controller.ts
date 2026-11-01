import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as usersService from "./users.service";

export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await usersService.getAllUsers(req.query as any);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Users fetched successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await usersService.getUserById(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await usersService.getUserById(req.user!.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Profile fetched successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateMe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await usersService.updateUser(req.user!.id, req.body);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await usersService.updateUser(req.params.id, req.body, req.user!.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await usersService.deleteUser(req.params.id, req.user!.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "User deactivated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const inviteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await usersService.inviteUser(req.user!.id, req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "User invited successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await usersService.getInvitation(req.params.token);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invitation fetched successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await usersService.acceptInvitation(req.params.token, req.body);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invitation accepted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const usersController = {
    getAllUsers,
    getUserById,
    getMe,
    updateMe,
    updateUser,
    deleteUser,
    inviteUser,
    getInvitation,
    acceptInvitation,
};

export default usersController;
