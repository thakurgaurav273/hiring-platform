import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import emailRepository from "./email.repository";
import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app-error";
import { randomUUID as uuidv4 } from "crypto";
import { emailService } from "./email.service";
import { prisma } from "../../database/prisma-client";

export const sendEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { candidateId, to, cc, subject, body, threadId, attachments } = req.body;

        await emailService.sendPlatformEmail({
            fromUserId: req.user!.id,
            to,
            cc,
            subject,
            body,
            candidateId,
            threadId,
            attachments,
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Email queued and dispatched",
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

export const getEmailById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const email = await emailRepository.findEmailById(req.params.id);
        if (!email) {
            throw new AppError("Email not found", StatusCodes.NOT_FOUND);
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Email fetched successfully",
            data: email,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllEmails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const skip = (page - 1) * limit;

        const where: Prisma.EmailWhereInput = {};
        if (req.query.candidateId) where.candidateId = req.query.candidateId as string;
        if (req.query.applicationId) where.applicationId = req.query.applicationId as string;
        if (req.query.threadId) where.threadId = req.query.threadId as string;
        if (req.query.direction) where.direction = req.query.direction as any;

        const [emails, total] = await Promise.all([
            emailRepository.findAllEmails({ skip, take: limit, where }),
            emailRepository.countEmails(where),
        ]);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Emails fetched successfully",
            data: {
                emails,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getEmailsByThreadId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const emails = await emailRepository.findEmailsByThreadId(req.params.threadId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Email thread fetched successfully",
            data: emails,
        });
    } catch (error) {
        next(error);
    }
};

export const getEmailsByCandidateId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const skip = (page - 1) * limit;

        const [emails, total] = await Promise.all([
            emailRepository.findEmailsByCandidateId({
                candidateId: req.params.candidateId,
                skip,
                take: limit,
            }),
            emailRepository.countEmailsByCandidateId(req.params.candidateId),
        ]);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate emails fetched successfully",
            data: {
                emails,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getCandidateThreads = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const threads = await emailRepository.getCandidateThreads(req.params.candidateId);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Candidate threads fetched successfully",
            data: threads,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /emails/:id/reply
 * Creates a new email in the same thread as the original and dispatches it.
 */
export const replyToEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const original = await prisma.email.findUnique({
             where: { id: req.params.id },
             include: { fromUser: true, candidate: true }
        });
        if (!original) {
            throw new AppError("Email not found", StatusCodes.NOT_FOUND);
        }

        if (!original.threadId) {
            throw new AppError("Original email has no thread ID", StatusCodes.BAD_REQUEST);
        }

        const { body, subject, cc, attachments } = req.body;
        const replySubject = subject || `Re: ${original.subject}`;
        
        let replyTo = original.to;
        if (original.fromUserId === req.user!.id) {
            // Replying to own email (e.g. bumping the thread)
            replyTo = original.to;
        } else {
            // Replying to someone else's email
            replyTo = original.fromUser?.email || original.candidate?.email || original.fromUserId || original.to;
        }
        
        const replyCc = cc || original.cc || [];

        await emailService.sendPlatformEmail({
            fromUserId: req.user!.id,
            to: replyTo,
            cc: replyCc,
            subject: replySubject,
            body,
            candidateId: original.candidateId || undefined,
            threadId: original.threadId,
            attachments,
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Reply queued and dispatched",
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /emails/:id/attachments
 * Uploads a file and appends it to the email's attachments JSON array.
 */
export const uploadAttachment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.file) {
            throw new AppError("No file uploaded", StatusCodes.BAD_REQUEST);
        }

        const email = await emailRepository.findEmailById(req.params.id);
        if (!email) {
            throw new AppError("Email not found", StatusCodes.NOT_FOUND);
        }

        const storageService = (await import("../../common/services/storage/storage.factory")).StorageFactory.getService();
        const { fileUrl: uploadedUrl, key } = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            "attachments"
        );

        const attachment = {
            fileName: req.file.originalname,
            fileUrl: key,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
        };

        const existingAttachments = (email.attachments as any[]) || [];
        const updatedEmail = await emailRepository.updateEmailAttachments(
            req.params.id,
            [...existingAttachments, attachment]
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Attachment uploaded successfully",
            data: updatedEmail,
        });
    } catch (error) {
        next(error);
    }
};

export const getThreads = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const folder = req.query.folder as string || "inbox";
        const threads = await emailRepository.getUserThreads(req.user!.id, folder);
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Threads fetched",
            data: threads
        });
    } catch (error) {
        next(error);
    }
};

export const getThreadById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const thread = await emailRepository.getThreadById(req.user!.id, req.params.threadId);
        
        if (!thread) {
            throw new AppError("Thread not found", StatusCodes.NOT_FOUND);
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Thread fetched",
            data: thread
        });
    } catch (error) {
        next(error);
    }
};

export const getMailboxCounts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const counts = await emailRepository.getCounts(req.user!.id);
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Counts fetched",
            data: counts
        });
    } catch (error) {
        next(error);
    }
};

export const updateThreadState = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { isUnread, isStarred, isArchived } = req.body;
        
        await emailRepository.updateThreadState(
            req.user!.id, 
            req.params.threadId, 
            { isUnread, isStarred, isArchived }
        );
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Thread updated",
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

export const deleteThread = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await emailRepository.deleteUserThread(req.user!.id, req.params.threadId);
        
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Thread deleted successfully",
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

const emailController = {
    sendEmail,
    getEmailById,
    getAllEmails,
    getEmailsByThreadId,
    getEmailsByCandidateId,
    getCandidateThreads,
    replyToEmail,
    uploadAttachment,
    getThreads,
    getThreadById,
    getMailboxCounts,
    updateThreadState,
    deleteThread,
};

export default emailController;
