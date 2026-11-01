import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import reportsService from "./reports.service";

export const getReports = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await reportsService.getReportsData(req.user);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Reports data fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
};

const reportsController = { getReports };
export default reportsController;
