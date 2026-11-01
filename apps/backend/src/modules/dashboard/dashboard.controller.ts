import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import dashboardService from "./dashboard.service";

export const getDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dashboardData = await dashboardService.getDashboardData(req.user);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData,
        });
    } catch (error) {
        next(error);
    }
};

const dashboardController = {
    getDashboard,
};

export default dashboardController;
