import { Prisma } from "@prisma/client";
import prisma from "../../database/prisma-client";

const createNote = async (data: Prisma.NoteUncheckedCreateInput) => {
    return prisma.note.create({
        data,
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const findNoteById = async (id: string) => {
    return prisma.note.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const findAllNotes = async (params: {
    skip: number;
    take: number;
    where: Prisma.NoteWhereInput;
}) => {
    const { skip, take, where } = params;
    return prisma.note.findMany({
        where,
        skip,
        take,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const countNotes = async (where: Prisma.NoteWhereInput) => {
    return prisma.note.count({
        where,
    });
};

const updateNote = async (id: string, data: Prisma.NoteUpdateInput) => {
    return prisma.note.update({
        where: { id },
        data,
        include: {
            author: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const deleteNote = async (id: string) => {
    return prisma.note.delete({
        where: { id },
    });
};

const createFeedback = async (data: Prisma.FeedbackUncheckedCreateInput) => {
    return prisma.feedback.create({
        data,
        include: {
            interviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const findFeedbackById = async (id: string) => {
    return prisma.feedback.findUnique({
        where: { id },
        include: {
            interviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const findAllFeedbacks = async (params: {
    skip: number;
    take: number;
    where: Prisma.FeedbackWhereInput;
}) => {
    const { skip, take, where } = params;
    return prisma.feedback.findMany({
        where,
        skip,
        take,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            interviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const countFeedbacks = async (where: Prisma.FeedbackWhereInput) => {
    return prisma.feedback.count({
        where,
    });
};

const updateFeedback = async (id: string, data: Prisma.FeedbackUpdateInput) => {
    return prisma.feedback.update({
        where: { id },
        data,
        include: {
            interviewer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
};

const deleteFeedback = async (id: string) => {
    return prisma.feedback.delete({
        where: { id },
    });
};

const notesFeedbackRepository = {
    createNote,
    findNoteById,
    findAllNotes,
    countNotes,
    updateNote,
    deleteNote,
    createFeedback,
    findFeedbackById,
    findAllFeedbacks,
    countFeedbacks,
    updateFeedback,
    deleteFeedback,
};

export default notesFeedbackRepository;
