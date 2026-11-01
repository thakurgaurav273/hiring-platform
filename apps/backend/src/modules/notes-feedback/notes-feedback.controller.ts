import * as tenant from "../../common/tenant/tenant-guards";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

import * as notesService from "./notes-feedback.service";

export const createNote = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertCandidateInOrg(req.body.candidateId, req.user!.organizationId);
        if (req.body.applicationId) await tenant.assertApplicationInOrg(req.body.applicationId, req.user!.organizationId);
        const note = await notesService.createNote(
            req.body,
            req.user!.id
        );

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Note created successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllNotes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const notes = await notesService.getAllNotes(req.query, req.user!.organizationId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Notes fetched successfully",
            data: notes,
        });
    } catch (error) {
        next(error);
    }
};

export const getNoteById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertNoteInOrg(req.params.id, req.user!.organizationId);
        const note = await notesService.getNoteById(
            req.params.id
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Note fetched successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const updateNote = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertNoteInOrg(req.params.id, req.user!.organizationId);
        const note = await notesService.updateNote(
            req.params.id,
            req.body
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Note updated successfully",
            data: note,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNote = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertNoteInOrg(req.params.id, req.user!.organizationId);
        await notesService.deleteNote(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Note deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const createFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertApplicationInOrg(req.body.applicationId, req.user!.organizationId);
        if (req.body.interviewId) await tenant.assertInterviewInOrg(req.body.interviewId, req.user!.organizationId);
        const feedback = await notesService.createFeedback(
            req.body,
            req.user!.id
        );

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Feedback created successfully",
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllFeedbacks = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const feedbacks = await notesService.getAllFeedbacks(req.query, req.user!.organizationId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Feedbacks fetched successfully",
            data: feedbacks,
        });
    } catch (error) {
        next(error);
    }
};

export const getFeedbackById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertFeedbackInOrg(req.params.id, req.user!.organizationId);
        const feedback = await notesService.getFeedbackById(
            req.params.id
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Feedback fetched successfully",
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

export const updateFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertFeedbackInOrg(req.params.id, req.user!.organizationId);
        const feedback = await notesService.updateFeedback(
            req.params.id,
            req.body
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Feedback updated successfully",
            data: feedback,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await tenant.assertFeedbackInOrg(req.params.id, req.user!.organizationId);
        await notesService.deleteFeedback(req.params.id);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Feedback deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const notesController = {
    createNote,
    getAllNotes,
    getNoteById,
    updateNote,
    deleteNote,
    createFeedback,
    getAllFeedbacks,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
};

export default notesController;
