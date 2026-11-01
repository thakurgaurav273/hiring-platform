import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import * as candidateService from "./candidates.service";

export const createCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const candidate = await candidateService.createCandidate(
            req.body,
            req.user!.id
        );

        if (req.file) {
            const resumesService = await import("../resumes/resumes.service");
            await resumesService.uploadResume(candidate.id, req.file);
        }

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Candidate created successfully",
            data: candidate,
        });
    } catch (error) {
        next(error);
    }
};


export const getAllCandidates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const candidates =
            await candidateService.getAllCandidates(req.query, req.user!);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidates fetched successfully",
            data: candidates,
        });
    } catch (error) {
        next(error);
    }
};


export const getCandidateById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const candidate = await candidateService.getCandidateById(
                req.params.id,
                req.user!
            );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate fetched successfully",
            data: candidate,
        });
    } catch (error) {
        next(error);
    }
};


export const updateCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const candidate =
            await candidateService.updateCandidate(
                req.params.id,
                req.body
            );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate updated successfully",
            data: candidate,
        });
    } catch (error) {
        next(error);
    }
};

export const updateCandidateStage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const candidate = await candidateService.updateCandidateStage(
                req.params.id,
                req.body.stage,
                req.user!.id,
                req.user!
            );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate stage updated successfully",
            data: candidate,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteCandidate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await candidateService.deleteCandidate(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const getCandidateNotes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const notes = await candidateService.getCandidateNotes(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Notes fetched successfully",
            data: notes,
        });
    } catch (error) {
        next(error);
    }
};

export const addCandidateNote = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const note = await candidateService.addCandidateNote(
            req.params.id,
            req.user!.id,
            req.body.content,
            req.body.opinion
        );

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Note added successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const getCandidateTimeline = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const timeline = await candidateService.getCandidateTimeline(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            data: timeline,
        });
    } catch (error) {
        next(error);
    }
};

const candidateController = {
    createCandidate,
    getAllCandidates,
    getCandidateById,
    updateCandidate,
    updateCandidateStage,
    deleteCandidate,
    getCandidateNotes,
    addCandidateNote,
    getCandidateTimeline,
};

export default candidateController;