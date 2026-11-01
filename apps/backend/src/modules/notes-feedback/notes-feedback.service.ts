import { AppError } from "../../common/errors/app-error";
import { StatusCodes } from "http-status-codes";
import notesFeedbackRepository from "./notes-feedback.repository";
import { Prisma } from "@prisma/client";

export const createNote = async (
    data: {
        candidateId: string;
        applicationId?: string;
        type?: "PRIVATE" | "GENERAL";
        content: string;
    },
    authorId: string
) => {
    const note = await notesFeedbackRepository.createNote({
        ...data,
        authorId,
    });

    return note;
};

export const getAllNotes = async (query: {
    page?: number;
    limit?: number;
    candidateId?: string;
    applicationId?: string;
}) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const { candidateId, applicationId } = query;

    const where: Prisma.NoteWhereInput = {};

    if (candidateId) {
        where.candidateId = candidateId;
    }

    if (applicationId) {
        where.applicationId = applicationId;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [notes, total] = await Promise.all([
        notesFeedbackRepository.findAllNotes({ skip, take, where }),
        notesFeedbackRepository.countNotes(where),
    ]);

    return {
        notes,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getNoteById = async (id: string) => {
    const note = await notesFeedbackRepository.findNoteById(id);

    if (!note) {
        throw new AppError("Note not found", StatusCodes.NOT_FOUND);
    }

    return note;
};

export const updateNote = async (
    id: string,
    data: {
        type?: "PRIVATE" | "GENERAL";
        content?: string;
    }
) => {
    const existingNote = await notesFeedbackRepository.findNoteById(id);

    if (!existingNote) {
        throw new AppError("Note not found", StatusCodes.NOT_FOUND);
    }

    const updatedNote = await notesFeedbackRepository.updateNote(id, data);

    return updatedNote;
};

export const deleteNote = async (id: string) => {
    const existingNote = await notesFeedbackRepository.findNoteById(id);

    if (!existingNote) {
        throw new AppError("Note not found", StatusCodes.NOT_FOUND);
    }

    await notesFeedbackRepository.deleteNote(id);

    return;
};

export const createFeedback = async (
    data: {
        applicationId: string;
        interviewId?: string;
        type: "TECHNICAL" | "HR";
        rating: number;
        recommendation: "STRONG_YES" | "YES" | "NEUTRAL" | "NO" | "STRONG_NO";
        comments?: string;
    },
    interviewerId: string
) => {
    const feedback = await notesFeedbackRepository.createFeedback({
        ...data,
        interviewerId,
    });

    return feedback;
};

export const getAllFeedbacks = async (query: {
    page?: number;
    limit?: number;
    applicationId?: string;
    interviewId?: string;
}) => {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;
    const { applicationId, interviewId } = query;

    const where: Prisma.FeedbackWhereInput = {};

    if (applicationId) {
        where.applicationId = applicationId;
    }

    if (interviewId) {
        where.interviewId = interviewId;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [feedbacks, total] = await Promise.all([
        notesFeedbackRepository.findAllFeedbacks({ skip, take, where }),
        notesFeedbackRepository.countFeedbacks(where),
    ]);

    return {
        feedbacks,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getFeedbackById = async (id: string) => {
    const feedback = await notesFeedbackRepository.findFeedbackById(id);

    if (!feedback) {
        throw new AppError("Feedback not found", StatusCodes.NOT_FOUND);
    }

    return feedback;
};

export const updateFeedback = async (
    id: string,
    data: {
        type?: "TECHNICAL" | "HR";
        rating?: number;
        recommendation?: "STRONG_YES" | "YES" | "NEUTRAL" | "NO" | "STRONG_NO";
        comments?: string;
    }
) => {
    const existingFeedback = await notesFeedbackRepository.findFeedbackById(id);

    if (!existingFeedback) {
        throw new AppError("Feedback not found", StatusCodes.NOT_FOUND);
    }

    const updatedFeedback = await notesFeedbackRepository.updateFeedback(id, data);

    return updatedFeedback;
};

export const deleteFeedback = async (id: string) => {
    const existingFeedback = await notesFeedbackRepository.findFeedbackById(id);

    if (!existingFeedback) {
        throw new AppError("Feedback not found", StatusCodes.NOT_FOUND);
    }

    await notesFeedbackRepository.deleteFeedback(id);

    return;
};
