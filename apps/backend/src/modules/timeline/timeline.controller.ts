import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as timelineService from "./timeline.service";
import { AppError } from "../../common/errors/app-error";

export const getHeatmap = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            throw new AppError("startDate and endDate are required", StatusCodes.BAD_REQUEST);
        }

        const data = await timelineService.getDailyCounts(
            req.user!,
            startDate as string,
            endDate as string
        );

        res.status(StatusCodes.OK).json({ data });
    } catch (error) {
        next(error);
    }
};

export const getTodayLedger = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await timelineService.getTodaysActivities(req.user!);
        res.status(StatusCodes.OK).json({ data });
    } catch (error) {
        next(error);
    }
};
