import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as resumesService from "./resumes.service";
import { AppError } from "../../common/errors/app-error";

export const uploadResume = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.file) {
            throw new AppError("No file uploaded", StatusCodes.BAD_REQUEST);
        }

        const resume = await resumesService.uploadResume(
            req.params.candidateId,
            req.file
        );

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Resume uploaded successfully",
            data: resume,
        });
    } catch (error) {
        next(error);
    }
};

export const getResumeById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resume = await resumesService.getResumeById(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Resume fetched successfully",
            data: resume,
        });
    } catch (error) {
        next(error);
    }
};

export const getResumesByCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resumes = await resumesService.getResumesByCandidateId(
            req.params.candidateId
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Resumes fetched successfully",
            data: resumes,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteResume = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await resumesService.deleteResume(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Resume deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const resumesController = {
    uploadResume,
    getResumeById,
    getResumesByCandidateId,
    deleteResume,
};

export default resumesController;
