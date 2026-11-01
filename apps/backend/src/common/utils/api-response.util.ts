import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: unknown;
}

export const successResponse = <T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = StatusCodes.OK
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

export const createdResponse = <T>(
    res: Response,
    message: string,
    data?: T
): Response => successResponse(res, message, data, StatusCodes.CREATED);

export const errorResponse = (
    res: Response,
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    errors?: unknown
): Response => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
